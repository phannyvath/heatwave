const variants = {
  primary: 'bg-ocean text-white hover:bg-[#d96514] focus:ring-ocean',
  blue: 'bg-heat text-white hover:bg-[#f47b20] focus:ring-heat',
  ghost: 'bg-white text-navy ring-1 ring-orange-100 hover:bg-cream focus:ring-ocean',
  warning: 'bg-heat text-white hover:bg-[#f47b20] focus:ring-heat',
  danger: 'bg-danger text-white hover:bg-[#874115] focus:ring-danger',
}

export default function Button({ as: Component = 'button', variant = 'primary', className = '', children, ...props }) {
  return (
    <Component
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
