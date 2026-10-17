"""选矿技术论坛 · 后端 API

Demo 阶段只覆盖需求文档第 9.1 节的六条主路径：
列表 / 详情 / 发帖 / 回答 / 补全案例卡 / 统计。

启动：
    python app.py          # 监听 0.0.0.0:5000，局域网可访问
"""

import json
import uuid
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from db import CARD_FIELDS, derive_status, get_conn, init_db, now

app = Flask(__name__)
CORS(app)  # 开发期允许跨域；生产部署时前端由同源提供

# Demo 里所有操作都记在这个用户名下。接真实登录后换成会话用户即可。
DEMO_USER = {"id": "me", "nickname": "我", "title": None}


# --------------------------------------------------------------------------
# 序列化
# --------------------------------------------------------------------------

def _loads(value, fallback):
    if not value:
        return fallback
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


def _post_to_dict(conn, row) -> dict:
    d = dict(row)
    author = conn.execute(
        "SELECT id, nickname, title FROM users WHERE id = ?", (d["author_id"],)
    ).fetchone()

    replies = conn.execute(
        """SELECT r.*, u.nickname, u.title
           FROM replies r LEFT JOIN users u ON u.id = r.author_id
           WHERE r.post_id = ? ORDER BY r.created_at""",
        (d["id"],),
    ).fetchall()

    return {
        "id": d["id"],
        "title": d["title"],
        "phenomenon": d["phenomenon"],
        "images": _loads(d["images"], []),
        "created_at": d["created_at"],
        "status": derive_status(d),
        "author": {
            "id": d["author_id"],
            "nickname": author["nickname"] if author else "匿名",
            "title": author["title"] if author else None,
        },
        "card": {
            "ore_type": d["ore_type"],
            "process": d["process"],
            "equipment": d["equipment"],
            "conditions": d["conditions"],
            "diagnosis": _loads(d["diagnosis"], []),
            "action": d["action"],
            "result": d["result"],
            "tags": _loads(d["tags"], []),
        },
        "replies": [
            {
                "id": r["id"],
                "content": r["content"],
                "created_at": r["created_at"],
                "accepted": bool(r["accepted"]),
                "author": {
                    "id": r["author_id"],
                    "nickname": r["nickname"] or "匿名",
                    "title": r["title"],
                },
            }
            for r in replies
        ],
        "reply_count": len(replies),
    }


# --------------------------------------------------------------------------
# 路由
# --------------------------------------------------------------------------

@app.get("/api/meta")
def meta():
    """筛选项。真实版本会从知识库的术语表里取，保证与教材用同一套语言。"""
    return jsonify(
        {
            "ore_types": ["铜", "钼", "铅锌", "金", "铁", "煤", "磷", "钨锡"],
            "processes": ["粗选", "精选", "扫选", "磨矿", "分级", "脱水", "其他"],
            "statuses": [
                {"value": "published", "label": "待补全"},
                {"value": "partial", "label": "部分结构化"},
                {"value": "closed", "label": "已闭环"},
            ],
            "current_user": DEMO_USER,
        }
    )


@app.get("/api/posts")
def list_posts():
    q = (request.args.get("q") or "").strip()
    ore = request.args.get("ore_type") or ""
    proc = request.args.get("process") or ""
    status = request.args.get("status") or ""
    sort = request.args.get("sort") or "new"

    sql = "SELECT * FROM posts WHERE 1=1"
    params: list = []
    if q:
        sql += " AND (title LIKE ? OR phenomenon LIKE ?)"
        params += [f"%{q}%", f"%{q}%"]
    if ore:
        sql += " AND ore_type = ?"
        params.append(ore)
    if proc:
        sql += " AND process = ?"
        params.append(proc)

    conn = get_conn()
    try:
        rows = conn.execute(sql, params).fetchall()
        items = [_post_to_dict(conn, r) for r in rows]
    finally:
        conn.close()

    if status:
        items = [i for i in items if i["status"] == status]

    if sort == "active":
        items.sort(key=lambda i: (i["reply_count"], i["created_at"]), reverse=True)
    elif sort == "closed":
        items.sort(key=lambda i: (i["status"] != "closed", i["created_at"]), reverse=True)
    else:
        items.sort(key=lambda i: i["created_at"], reverse=True)

    return jsonify({"items": items, "total": len(items)})


@app.get("/api/posts/<pid>")
def get_post(pid):
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (pid,)).fetchone()
        if not row:
            return jsonify({"error": "not found"}), 404
        post = _post_to_dict(conn, row)
        logs = conn.execute(
            "SELECT field, value, by_user, at FROM field_logs WHERE post_id = ? ORDER BY at",
            (pid,),
        ).fetchall()
        post["field_logs"] = [dict(l) for l in logs]
        return jsonify(post)
    finally:
        conn.close()


@app.post("/api/posts")
def create_post():
    """发帖：只要求标题和现象，其余一律可以留空——这是零门槛的关键。"""
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    phenomenon = (data.get("phenomenon") or "").strip()

    if not title:
        return jsonify({"error": "标题不能为空"}), 400
    if not phenomenon:
        return jsonify({"error": "请描述一下现象"}), 400

    pid = uuid.uuid4().hex[:12]
    images = data.get("images") or []

    conn = get_conn()
    try:
        conn.execute("INSERT OR IGNORE INTO users (id, nickname, title) VALUES (?,?,?)",
                     (DEMO_USER["id"], DEMO_USER["nickname"], DEMO_USER["title"]))
        conn.execute(
            """INSERT INTO posts (id, title, phenomenon, images, author_id, created_at, tags)
               VALUES (?,?,?,?,?,?,?)""",
            (pid, title, phenomenon,
             json.dumps(images, ensure_ascii=False),
             DEMO_USER["id"], now(), json.dumps([], ensure_ascii=False)),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (pid,)).fetchone()
        return jsonify(_post_to_dict(conn, row)), 201
    finally:
        conn.close()


@app.post("/api/posts/<pid>/replies")
def add_reply(pid):
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "回答不能为空"}), 400

    conn = get_conn()
    try:
        if not conn.execute("SELECT 1 FROM posts WHERE id = ?", (pid,)).fetchone():
            return jsonify({"error": "not found"}), 404
        conn.execute("INSERT OR IGNORE INTO users (id, nickname, title) VALUES (?,?,?)",
                     (DEMO_USER["id"], DEMO_USER["nickname"], DEMO_USER["title"]))
        conn.execute(
            """INSERT INTO replies (id, post_id, author_id, content, created_at, accepted)
               VALUES (?,?,?,?,?,0)""",
            (uuid.uuid4().hex[:12], pid, DEMO_USER["id"], content, now()),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (pid,)).fetchone()
        return jsonify(_post_to_dict(conn, row)), 201
    finally:
        conn.close()


@app.patch("/api/posts/<pid>/card")
def update_card(pid):
    """补全案例卡。

    这是本论坛区别于普通论坛的核心接口：任何登录用户都能补充字段，
    改动留痕，补充后状态按状态机自动推进。
    """
    data = request.get_json(silent=True) or {}
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (pid,)).fetchone()
        if not row:
            return jsonify({"error": "not found"}), 404

        updates, values = [], []
        for field in CARD_FIELDS:
            if field not in data:
                continue
            raw = data[field]
            if field in ("diagnosis", "tags"):
                value = json.dumps(raw or [], ensure_ascii=False)
            else:
                value = (raw or "").strip() or None
            updates.append(f"{field} = ?")
            values.append(value)
            if value:
                conn.execute(
                    """INSERT INTO field_logs (post_id, field, value, by_user, at)
                       VALUES (?,?,?,?,?)""",
                    (pid, field, raw if isinstance(raw, str) else json.dumps(raw, ensure_ascii=False),
                     DEMO_USER["nickname"], now()),
                )

        if not updates:
            return jsonify({"error": "没有要更新的字段"}), 400

        values.append(pid)
        conn.execute(f"UPDATE posts SET {', '.join(updates)} WHERE id = ?", values)
        conn.commit()

        row = conn.execute("SELECT * FROM posts WHERE id = ?", (pid,)).fetchone()
        return jsonify(_post_to_dict(conn, row))
    finally:
        conn.close()


@app.get("/api/stats")
def stats():
    """需求文档第 11 节的指标。重点是闭环数与闭环率，不是发帖数。"""
    conn = get_conn()
    try:
        rows = conn.execute("SELECT * FROM posts").fetchall()
        posts = [_post_to_dict(conn, r) for r in rows]
    finally:
        conn.close()

    total = len(posts)
    closed = sum(1 for p in posts if p["status"] == "closed")
    replied = sum(1 for p in posts if p["reply_count"] > 0)

    filled = 0
    for p in posts:
        card = p["card"]
        filled += sum(
            1 for k in ("ore_type", "process", "equipment", "conditions", "action", "result")
            if card.get(k)
        )
    max_fields = total * 6 or 1

    return jsonify(
        {
            "total_posts": total,
            "closed_cases": closed,
            "closure_rate": round(closed / total, 3) if total else 0,
            "reply_rate": round(replied / total, 3) if total else 0,
            "field_fill_rate": round(filled / max_fields, 3),
            "knowledge_chunks": closed * 3,  # 占位：真实值由导出流程统计
        }
    )


@app.get("/api/export/preview")
def export_preview():
    """演示"论坛数据 → 知识库片段"的导出格式（需求文档 6.1）。"""
    conn = get_conn()
    try:
        rows = conn.execute("SELECT * FROM posts").fetchall()
        posts = [_post_to_dict(conn, r) for r in rows]
    finally:
        conn.close()

    chunks = []
    for p in posts:
        if p["status"] != "closed":
            continue
        c = p["card"]
        chunks.append(
            {
                "id": f"case:{p['id']}",
                "source_type": "case",
                "content": "；".join(
                    filter(None, [p["phenomenon"], c.get("diagnosis") and "诊断：" + "、".join(c["diagnosis"]),
                                  c.get("action") and "处置：" + c["action"],
                                  c.get("result") and "结果：" + c["result"]])
                ),
                "structured": c,
                "provenance": f"/posts/{p['id']}",
                "evidence_level": "B",  # 已闭环案例
                "desensitized": True,
            }
        )
    return jsonify({"chunks": chunks, "count": len(chunks)})


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
