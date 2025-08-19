import { ReactNode } from 'react'

interface CustomCardProps {
  children: ReactNode
  title?: string
  icon?: ReactNode
  className?: string
}

export function CustomCard({ children, title, icon, className = '' }: CustomCardProps) {
  return (
    <div className={`card-custom group ${className}`}>
      {(title || icon) && (
        <div className="flex items-center mb-6">
          {icon && (
            <div className="mr-4 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          )}
          {title && <h3 className="text-2xl font-bold text-gray-800">{title}</h3>}
        </div>
      )}
      <div className="text-gray-600">
        {children}
      </div>
    </div>
  )
}
