import * as zhUntyped from 'i18n/zh.json'
import * as enUntyped from 'i18n/en.json'

const zh: any = zhUntyped
const en: any = enUntyped

export function localize(lang: string, key: string): string {
    switch(lang) {
        case 'zh':
        return zh[key]
        case 'en':
        return en[key]
    }
    return "UNKNOWN_I18N_KEY"
}

export function localizeError(lang: string, code: number | null | undefined): string {
    if(!code) code = 1
    let codeStr = code.toString()
    switch(lang) {
        case 'zh':
            return zh.errors[codeStr]
        case 'en':
            return en.errors[codeStr]
    }
    return "UNKNOWN_I18N_KEY"
}
