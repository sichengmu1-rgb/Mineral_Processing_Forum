import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

/**
 * 发帖页。
 *
 * 刻意只要求两样东西：标题 + 现象。其余字段一律留到发帖之后补全——
 * 这是"零门槛发帖"的落地，也是这个论坛不会重蹈老论坛覆辙的关键。
 */
export function NewPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [phenomenon, setPhenomenon] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function pickImages(files: FileList | null) {
    if (!files?.length) return
    // Demo 不接图床，本地读成 dataURL 直接展示；真实版本走上传接口
    Array.from(files).forEach((f) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(f)
    })
  }

  async function submit() {
    if (!title.trim()) return setError('请写一个标题')
    if (!phenomenon.trim()) return setError('请描述一下现象')

    setSubmitting(true)
    setError('')
    try {
      const post = await api.create({ title, phenomenon, images })
      navigate(`/posts/${post.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold">提个问题</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          只写现象就行，越具体越好。工况、设备这些别人会帮你补。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">标题</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="一句话说清问题，比如：铜粗选槽冒槽，泡沫直接往外溢"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phenomenon">现象描述</Label>
        <Textarea
          id="phenomenon"
          rows={5}
          value={phenomenon}
          onChange={(e) => setPhenomenon(e.target.value)}
          placeholder="什么时候开始的、什么样的现象、你试过什么、有没有效果……"
        />
      </div>

      <div className="space-y-2">
        <Label>现场照片（可选）</Label>
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt=""
                className="h-20 w-20 rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-5 w-5" />
            加照片
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => pickImages(e.target.files)}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <Button onClick={() => void submit()} disabled={submitting} className="flex-1">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          发布
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          取消
        </Button>
      </div>

      <p className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
        发布前请留意：不要写具体的矿山名称、产能、成本和客户信息。
        这些内容会被审核处理，也关系到你所在单位。
      </p>
    </div>
  )
}
