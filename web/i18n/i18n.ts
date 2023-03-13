import * as zhUntyped from 'i18n/zh.json'
import * as enUntyped from 'i18n/en.json'

const zh: any = zhUntyped
const en: any = enUntyped

export function localize(lang: string, key: string) {
    switch(lang) {
        case 'zh':
        return zh[key]
        case 'en':
        return en[key]
    }
}

