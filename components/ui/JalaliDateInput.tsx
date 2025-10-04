import React, { useState, useEffect } from 'react'
import { toJalaali, toGregorian } from 'jalaali-js'

interface JalaliDateInputProps {
    label: string
    required?: boolean
    value?: string
    onChange?: (value: string) => void
    helper?: string
    className?: string
}

export const JalaliDateInput: React.FC<JalaliDateInputProps> = ({
    label,
    required = false,
    value = '',
    onChange,
    helper,
    className = ''
}) => {
    const [jalaliValue, setJalaliValue] = useState('')
    const [gregorianValue, setGregorianValue] = useState('')

    // Convert Gregorian to Jalali
    const gregorianToJalali = (gregorianDate: string) => {
        if (!gregorianDate) return ''
        
        try {
            const [year, month, day] = gregorianDate.split('-').map(Number)
            const jalali = toJalaali(year, month, day)
            return `${jalali.jy}/${jalali.jm.toString().padStart(2, '0')}/${jalali.jd.toString().padStart(2, '0')}`
        } catch {
            return ''
        }
    }

    // Convert Jalali to Gregorian
    const jalaliToGregorian = (jalaliDate: string) => {
        if (!jalaliDate) return ''
        
        try {
            const parts = jalaliDate.split('/')
            if (parts.length !== 3) return ''
            
            const [year, month, day] = parts.map(Number)
            if (isNaN(year) || isNaN(month) || isNaN(day)) return ''
            
            const gregorian = toGregorian(year, month, day)
            return `${gregorian.gy}-${gregorian.gm.toString().padStart(2, '0')}-${gregorian.gd.toString().padStart(2, '0')}`
        } catch {
            return ''
        }
    }

    // Update when external value changes
    useEffect(() => {
        if (value && value !== gregorianValue) {
            setGregorianValue(value)
            setJalaliValue(gregorianToJalali(value))
        } else if (!value) {
            setGregorianValue('')
            setJalaliValue('')
        }
    }, [value])

    const handleJalaliChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        setJalaliValue(inputValue)
        
        const gregorian = jalaliToGregorian(inputValue)
        setGregorianValue(gregorian)
        onChange?.(gregorian)
    }

    const handleTodayClick = () => {
        const today = new Date()
        const jalali = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate())
        const todayJalali = `${jalali.jy}/${jalali.jm.toString().padStart(2, '0')}/${jalali.jd.toString().padStart(2, '0')}`
        
        setJalaliValue(todayJalali)
        const gregorian = jalaliToGregorian(todayJalali)
        setGregorianValue(gregorian)
        onChange?.(gregorian)
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            
            <div className="flex space-x-2 space-x-reverse">
                <input
                    type="text"
                    value={jalaliValue}
                    onChange={handleJalaliChange}
                    placeholder="1403/01/01"
                    className="form-control flex-1"
                    required={required}
                    dir="ltr"
                />
                <button
                    type="button"
                    onClick={handleTodayClick}
                    className="btn-secondary text-xs px-3 py-2 whitespace-nowrap"
                >
                    امروز
                </button>
            </div>
            
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
