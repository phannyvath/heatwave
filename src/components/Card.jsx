export default function Card({ as: Component = 'section', className = '', children, ...props }) {
  return (
    <Component
      className={`rounded-[1.4rem] border border-orange-100 bg-white shadow-soft ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
