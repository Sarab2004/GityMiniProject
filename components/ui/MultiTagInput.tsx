import React, { useMemo, useState } from 'react'

interface TagOption {
    value: string
    label: string
}

interface MultiTagInputProps {
    label: string
    value?: string[]
    onChange?: (value: string[]) => void
    options?: TagOption[]
    placeholder?: string
    helper?: string
    maxItems?: number
    maxLength?: number
    required?: boolean
    className?: string
}

const DEFAULT_MAX_ITEMS = 12
const DEFAULT_MAX_LENGTH = 60

export const MultiTagInput: React.FC<MultiTagInputProps> = ({
    label,
    value = [],
    onChange,
    options = [],
    placeholder = '',
    helper,
    maxItems = DEFAULT_MAX_ITEMS,
    maxLength = DEFAULT_MAX_LENGTH,
    required = false,
    className = '',
}) => {
    const [inputValue, setInputValue] = useState('')
    const [error, setError] = useState<string | null>(null)

    const availableOptions = useMemo(
        () => options.filter((option) => !value.includes(option.label)),
        [options, value],
    )

    const emitChange = (next: string[]) => {
        onChange?.(next)
    }

    const setValidationError = (message: string) => {
        setError(message)
    }

    const clearValidationError = () => {
        setError(null)
    }

    const addTag = (raw: string) => {
        const trimmed = raw.trim()
        if (!trimmed) {
            return
        }
        if (value.includes(trimmed)) {
            return setValidationError('این سند قبلاً اضافه شده است.')
        }
        if (value.length >= maxItems) {
            return setValidationError(`حداکثر ${maxItems} سند قابل ثبت است.`)
        }
        if (trimmed.length > maxLength) {
            return setValidationError(`هر عنوان حداکثر باید ${maxLength} کاراکتر باشد.`)
        }
        clearValidationError()
        emitChange([...value, trimmed])
        setInputValue('')
    }

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
        if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
            event.preventDefault()
            addTag(inputValue)
        }
    }

    const handleRemove = (tag: string) => {
        clearValidationError()
        emitChange(value.filter((item) => item !== tag))
    }

    const handleSuggestionClick = (option: TagOption) => {
        addTag(option.label)
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                    {value.map((tag) => (
                        <span
                            key={tag}
                            className="flex items-center gap-2 rounded-full bg-primarySubtle px-3 py-1 text-sm text-primary"
                        >
                            <span className="truncate max-w-[180px]">{tag}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(tag)}
                                className="text-primary hover:text-danger focus-ring"
                                aria-label={`حذف ${tag}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(event) => {
                            setInputValue(event.target.value)
                            if (error) {
                                clearValidationError()
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        maxLength={maxLength}
                        placeholder={placeholder}
                        className="min-w-[180px] flex-1 border-none bg-transparent px-0 text-sm text-text placeholder-muted focus:outline-none"
                    />
                </div>

                {availableOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {availableOptions.map((option) => (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => handleSuggestionClick(option)}
                                className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-primary hover:text-primary focus-ring transition-colors"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {error ? (
                <p className="text-xs text-danger">{error}</p>
            ) : helper ? (
                <p className="text-xs text-muted">{helper}</p>
            ) : null}
            <p className="text-xs text-muted">
                {`حداکثر ${maxItems} عنوان، طول هر مورد تا ${maxLength} کاراکتر.`}
            </p>
        </div>
    )
}
