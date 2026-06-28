interface DividerProps {
  variant?: 'thin' | 'thick' | 'double' | 'soft'
}

/** 分隔线。默认细线，可选粗线/双线/浅线 */
export function Divider({ variant = 'thin' }: DividerProps) {
  if (variant === 'thick') return <hr className="rule-thick" />
  if (variant === 'double') return <hr className="rule-double" />
  if (variant === 'soft') return <hr className="rule-soft" />
  return <hr className="rule" />
}
