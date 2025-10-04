import React from 'react'
import { JalaliDateInput } from './JalaliDateInput'

interface DateInputProps {
    label: string
    required?: boolean
    value?: string
    onChange?: (value: string) => void
    helper?: string
    className?: string
}

export const DateInput: React.FC<DateInputProps> = (props) => {
    return <JalaliDateInput {...props} />
}
