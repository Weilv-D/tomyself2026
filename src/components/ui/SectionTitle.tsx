interface SectionTitleProps {
  roman: string
  title: string
  sub?: string
}

/** 章节标题：罗马数字（朱砂斜体）+ 中文宋体标题 + 右侧英文题注 */
export function SectionTitle({ roman, title, sub }: SectionTitleProps) {
  return (
    <header className="section-head">
      <span className="roman">{roman}</span>
      <h2 className="title">{title}</h2>
      {sub && <span className="sub">{sub}</span>}
    </header>
  )
}
