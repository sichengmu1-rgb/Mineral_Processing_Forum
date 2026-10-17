"""数据库初始化与种子数据。

表结构对应《论坛需求文档》第 5 节：
  posts      —— 帖子 + 挂在上面的案例卡字段
  replies    —— 回答
  field_logs —— 案例卡字段的补全记录（谁在什么时候补了什么）
"""

import json
import sqlite3
import uuid
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "forum.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    title    TEXT
);

CREATE TABLE IF NOT EXISTS posts (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    phenomenon TEXT NOT NULL,
    images     TEXT NOT NULL DEFAULT '[]',
    author_id  TEXT NOT NULL,
    created_at TEXT NOT NULL,
    -- 案例卡字段，全部可空：只有标题和现象是发帖时必填的
    ore_type   TEXT,
    process    TEXT,
    equipment  TEXT,
    conditions TEXT,
    diagnosis  TEXT,
    action     TEXT,
    result     TEXT,
    tags       TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS replies (
    id         TEXT PRIMARY KEY,
    post_id    TEXT NOT NULL,
    author_id  TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    accepted   INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS field_logs (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    field   TEXT NOT NULL,
    value   TEXT,
    by_user TEXT NOT NULL,
    at      TEXT NOT NULL
);
"""

CARD_FIELDS = (
    "ore_type",
    "process",
    "equipment",
    "conditions",
    "diagnosis",
    "action",
    "result",
    "tags",
)


def now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def derive_status(row: sqlite3.Row | dict) -> str:
    """按需求文档 5.3 的状态机推导状态。

    有处置且有结果 -> 已闭环；补过任一结构化字段 -> 部分结构化；否则 -> 已发布。
    """
    get = row.get if isinstance(row, dict) else (lambda k, d=None: row[k])
    if get("action") and get("result"):
        return "closed"
    if get("ore_type") or get("process") or get("equipment"):
        return "partial"
    return "published"


# --------------------------------------------------------------------------
# 种子数据：八条真实形态的现场问题，覆盖需求文档里列出的各类现象
# --------------------------------------------------------------------------

USERS = [
    ("u1", "老马", "某铜矿浮选工"),
    ("u2", "阿凯", "选厂技术员"),
    ("u3", "小陈", "矿物加工在读"),
    ("u4", "王工", None),
    ("u5", "老周", "某铅锌矿值班长"),
    ("u6", "李工", "设备厂家工程师"),
]


def _posts():
    """(标题, 现象, 矿种, 工序, 设备, 工况, 诊断, 处置, 结果, 标签, 作者, 几天前, 图片数)"""
    return [
        (
            "铜粗选槽冒槽，泡沫直接往外溢",
            "今天白班开始铜粗选第一槽一直冒槽，泡沫发白、发脆，刮出来一层就塌，矿浆面压不住，已经往外溢了。调整充气量没什么用。",
            "铜", "粗选", "充气机械搅拌式浮选机 16m³",
            "给矿品位 0.68%，磨矿细度 -74μm 占 62%，矿浆浓度 32%，pH 10.5，丁黄药 60 g/t，松醇油 20 g/t",
            ["起泡剂过量导致泡沫过脆", "给矿品位偏高、浮选浓度偏大", "充气量过大"],
            "先把松醇油降到 12 g/t，同时把充气量从 1.2 降到 0.9 m³/min，20 分钟后泡沫明显变稳，没有再冒槽。",
            "有效。当天精矿品位 21.3%，回收率 88.6%，比前一天提高 1.2 个百分点。",
            ["冒槽", "起泡剂", "铜粗选"],
            "u1", 3, 2,
        ),
        (
            "钼精选泡沫突然变黏，精矿品位掉得厉害",
            "钼精选的泡沫这两周变得特别黏，像糊状，泡沫上带很多矿泥，精矿品位从 45% 掉到 38% 左右。",
            "钼", "精选", "浮选柱",
            "给矿品位 25%，矿浆浓度 18%，pH 8.5，煤油 120 g/t，水玻璃 300 g/t",
            ["矿泥含量升高", "抑制剂添加量不足", "精选浓度偏高"],
            "把水玻璃用量提到 500 g/t，精选浓度从 18% 降到 12%，同时加强预先脱泥。",
            "有效。一周后精矿品位回到 44.5%，泡沫不再发黏。",
            ["泡沫异常", "钼精选", "矿泥"],
            "u2", 8, 3,
        ),
        (
            "铅锌浮选指标这个月一直上不去，找不到原因",
            "铅精矿品位和回收率都比上月低，铅品位从 55% 掉到 49%，回收率掉了 6 个点。药剂没换，设备也没动过。",
            "铅锌", "粗选", None,
            None, [], None, None,
            ["指标下降", "铅锌"],
            "u5", 12, 1,
        ),
        (
            "旋流器分级不稳定，返砂忽大忽小",
            "二段闭路磨矿的旋流器这几天很不稳，溢流细度一会儿 65% 一会儿 78%，返砂量忽大忽小，泵池液位也跳。",
            "铜", "分级", "φ350 水力旋流器",
            None, [], None, None,
            ["旋流器不稳", "分级"],
            "u2", 5, 2,
        ),
        (
            "煤泥浮选药剂消耗比同类厂高不少",
            "我们厂煤泥浮选的捕收剂单耗 1.8 kg/t 干煤泥，问了几家同类厂都在 1.2 左右，想知道差在哪。",
            "煤", "粗选", "机械搅拌式浮选机",
            "入料灰分 22%，-0.5mm 占 85%，矿浆浓度 80 g/L，柴油 1.5 kg/t，仲辛醇 0.3 kg/t",
            ["药剂制度不合理", "入料粒度偏粗", "浮选浓度偏低"],
            "把矿浆浓度从 80 g/L 提到 110 g/L，柴油改成乳化后添加，单耗降到 1.25 kg/t。",
            "有效。单耗降到 1.25 kg/t，精煤产率还提高了 0.8 个百分点。",
            ["药剂问题", "煤泥", "节能降耗"],
            "u4", 20, 1,
        ),
        (
            "磷矿浮选泡沫太多，消不下去",
            "磷矿反浮选，泡沫量特别大而且很稳，消泡水加了不少也压不住，后面浓缩池都受影响了。",
            "磷", "粗选", "充气机械搅拌式浮选机",
            "给矿 P2O5 22%，pH 9.0，捕收剂 800 g/t",
            ["捕收剂过量", "回水中有机物累积"],
            None, None,
            ["泡沫异常", "磷矿", "回水"],
            "u3", 15, 2,
        ),
        (
            "金矿浮选精矿品位波动很大",
            "同一批矿，早中晚三班的金精矿品位能差 15 g/t，取样化验没问题，就是波动大。",
            "金", "粗选", None,
            None, [], None, None,
            ["指标下降", "金矿", "波动"],
            "u6", 6, 1,
        ),
        (
            "铁精矿脱硫浮选硫含量降不下来",
            "磁选铁精矿含硫 0.8%，要求降到 0.3% 以下，反浮选脱硫效果一直不理想。",
            "铁", "扫选", "浮选机 8m³",
            "给矿 TFe 66%，S 0.8%，pH 5.5，丁黄药 150 g/t，硫酸铜 200 g/t",
            ["活化剂用量不足", "pH 偏低导致黄药分解", "粒度偏粗解离不充分"],
            "把 pH 提到 6.5，硫酸铜加到 350 g/t，再磨使 -74μm 提到 78%。",
            "有效。硫降到 0.26%，铁品位基本没受影响。",
            ["脱硫", "铁精矿", "反浮选"],
            "u4", 25, 2,
        ),
    ]


REPLIES = {
    "铜粗选槽冒槽，泡沫直接往外溢": [
        ("u4", "先看松醇油。泡沫发白、发脆、一刮就塌，是典型的起泡剂过量特征，跟充气量关系不大。", True),
        ("u1", "确实，把松醇油降下来就好了。", False),
        ("u3", "请教一下，起泡剂过量为什么会冒槽？书上说不是应该泡沫更稳吗？", False),
    ],
    "钼精选泡沫突然变黏，精矿品位掉得厉害": [
        ("u5", "矿泥上浮带进来的。你们是不是最近换了采矿段？", False),
        ("u2", "对，上个月采场换到氧化带那边了，矿泥确实多。", True),
        ("u4", "加强脱泥 + 加水玻璃，浓度也要降下来，18% 对精选来说偏高。", False),
    ],
    "铅锌浮选指标这个月一直上不去，找不到原因": [
        ("u4", "先查原矿。品位掉了不一定是浮选的问题，采场配矿变了也会这样。", False),
        ("u5", "化验数据看了，原矿铅品位确实比上月低 0.1 个点，但回收率不该掉这么多。", False),
    ],
    "旋流器分级不稳定，返砂忽大忽小": [
        ("u6", "先查泵池液位和给矿压力。压力不稳，分级效率肯定不稳。", False),
        ("u2", "压力表是有点跳，回头查一下泵。", False),
    ],
    "煤泥浮选药剂消耗比同类厂高不少": [
        ("u6", "浓度偏低是主因。80 g/L 太稀了，提到 110 左右药剂单耗能降不少。", True),
        ("u4", "另外柴油最好乳化后再加，直接加损失大。", False),
    ],
    "磷矿浮选泡沫太多，消不下去": [
        ("u4", "先减捕收剂，反浮选捕收剂过量泡沫就下不来。再看看回水的水质。", False),
    ],
    "金矿浮选精矿品位波动很大": [
        ("u5", "看是不是配矿的问题，三班进的矿不一样。", False),
    ],
    "铁精矿脱硫浮选硫含量降不下来": [
        ("u4", "pH 5.5 太低了，黄药在酸性条件下分解快，先提到 6.5 以上。", True),
        ("u6", "粒度也要看，解离不充分的话再磨是必须的。", False),
    ],
}


def seed(conn: sqlite3.Connection) -> None:
    is_empty = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0] == 0
    if not is_empty:
        return

    conn.executemany(
        "INSERT OR IGNORE INTO users (id, nickname, title) VALUES (?, ?, ?)", USERS
    )

    base = datetime.now()
    for (
        title, phen, ore, proc, equip, cond, diag,
        action, result, tags, author, days_ago, n_img,
    ) in _posts():
        pid = uuid.uuid4().hex[:12]
        created = (base - timedelta(days=days_ago, hours=2)).isoformat(timespec="seconds")
        # Demo 不接真实图床，用占位图代替现场照片
        images = [f"https://picsum.photos/seed/{pid}{i}/640/420" for i in range(n_img)]

        conn.execute(
            """INSERT INTO posts
               (id, title, phenomenon, images, author_id, created_at,
                ore_type, process, equipment, conditions, diagnosis, action, result, tags)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                pid, title, phen, json.dumps(images, ensure_ascii=False), author, created,
                ore, proc, equip, cond,
                json.dumps(diag, ensure_ascii=False) if diag else None,
                action, result,
                json.dumps(tags, ensure_ascii=False),
            ),
        )

        for i, (ra, content, accepted) in enumerate(REPLIES.get(title, [])):
            conn.execute(
                """INSERT INTO replies (id, post_id, author_id, content, created_at, accepted)
                   VALUES (?,?,?,?,?,?)""",
                (
                    uuid.uuid4().hex[:12], pid, ra, content,
                    (base - timedelta(days=days_ago, hours=1) + timedelta(minutes=30 * i)).isoformat(timespec="seconds"),
                    1 if accepted else 0,
                ),
            )

        # 已填的字段补一条来源记录，展示"谁补的"
        for field, value in (
            ("ore_type", ore), ("process", proc), ("equipment", equip),
            ("conditions", cond), ("action", action), ("result", result),
        ):
            if value:
                conn.execute(
                    """INSERT INTO field_logs (post_id, field, value, by_user, at)
                       VALUES (?,?,?,?,?)""",
                    (pid, field, value, author, created),
                )

    conn.commit()


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_conn()
    try:
        conn.executescript(SCHEMA)
        seed(conn)
    finally:
        conn.close()
