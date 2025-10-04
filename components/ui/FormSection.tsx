import React from 'react'

interface FormSectionProps {
    title: string
    children: React.ReactNode
    className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({
    title,
    children,
    className = ''
}) => {
    return (
        <div className={`form-section ${className}`}>
            <h3 className="text-lg font-semibold text-text mb-4 border-b border-divider pb-2">
                {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    )
}
