import { ChocolcateResponse } from "./datatypes";
import { api } from "@/api/api"

export function GET<ResType extends ChocolcateResponse>(url: string, params: any = undefined): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.get<ResType>(url, { params }).then((value) => {
            resolve(value.data)
        }).catch((e) => {
                reject(e)
            })
    })
}

export function POST<ReqType, ResType extends ChocolcateResponse>(url: string, data: ReqType): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.post<ResType>(url, data).then((value) => {
            resolve(value.data)
        }).catch((e) => {
                reject(e)
            })
    })
}

export function PATCH<ReqType, ResType extends ChocolcateResponse>(url: string, data: ReqType): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.patch<ResType>(url, data).then((value) => {
            resolve(value.data)
        }).catch((e) => {
            reject(e)
        })
    })
}

export function PATCH_WithoutData<ResType extends ChocolcateResponse>(url: string): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.patch<ResType>(url).then((value) => {
            resolve(value.data)
        }).catch((e) => {
            reject(e)
        })
    })
}

export function DELETE<ResType extends ChocolcateResponse>(url: string): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.delete<ResType>(url).then((value) => {
            resolve(value.data)
        }).catch((e) => {
            reject(e)
        })
    })
}

export function PUT<ReqType, ResType extends ChocolcateResponse>(url: string, data: ReqType): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.put<ResType>(url, data).then((value) => {
            resolve(value.data)
        }).catch((e) => {
            reject(e)
        })
    })
}

export function PUT_WithoutData<ResType extends ChocolcateResponse>(url: string): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.put<ResType>(url,).then((value) => {
            resolve(value.data)
        }).catch((e) => {
            reject(e)
        })
    })
}

