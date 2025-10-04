import React from 'react'

interface NumberInputProps {
    label: string
    placeholder?: string
    required?: boolean
    value?: number | string
    onChange?: (value: number | string) => void
    min?: number
    max?: number
    helper?: string
    className?: string
}

export const NumberInput: React.FC<NumberInputProps> = ({
    label,
    placeholder,
    required = false,
    value = '',
    onChange,
    min,
    max,
    helper,
    className = ''
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        // Allow empty string or valid numbers
        if (inputValue === '' || !isNaN(Number(inputValue))) {
            onChange?.(inputValue)
        }
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                min={min}
                max={max}
                className="form-control w-full"
                required={required}
            />
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
