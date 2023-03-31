import { ChocolcateResponse } from "./datatypes";
import { api } from "@/api/api"
import axios from "axios";

export function GET<ResType extends ChocolcateResponse>(url: string): Promise<ResType> {
    return new Promise(async (resolve, reject) => {
        api.get<ResType>(url).then((value) => {
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
