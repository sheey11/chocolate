export interface LanguageSpecification {
    name: string
    icon: string
}

export interface LanguageSpecifications {
    [index: string]: LanguageSpecification
}

export const languages: LanguageSpecifications = {
    "zh": {
        "name": "简体中文",
        "icon": "🇨🇳",
    },
    "en": {
        "name": "English",
        "icon": "🇺🇸",
    }
}

