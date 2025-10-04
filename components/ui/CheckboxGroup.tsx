import React from 'react'

interface CheckboxOption {
    value: string
    label: string
}

interface CheckboxGroupProps {
    label: string
    options: CheckboxOption[]
    required?: boolean
    value?: string[]
    onChange?: (value: string[]) => void
    helper?: string
    className?: string
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    label,
    options,
    required = false,
    value = [],
    onChange,
    helper,
    className = ''
}) => {
    const handleChange = (optionValue: string, checked: boolean) => {
        if (checked) {
            onChange?.([...value, optionValue])
        } else {
            onChange?.(value.filter(v => v !== optionValue))
        }
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            <div className="space-y-2">
                {options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value.includes(option.value)}
                            onChange={(e) => handleChange(option.value, e.target.checked)}
                            className="h-4 w-4 text-accent border-border rounded focus:ring-focus"
                        />
                        <span className="text-sm text-text">{option.label}</span>
                    </label>
                ))}
            </div>
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
