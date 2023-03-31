// Usage:
// ```
// try {
//   // do your thing
// } catch(e RequestException) {
//   e
//   .handle(1, function(e) {
//     // handle code 1
//   })
//   .handle(2, function(e) {
//     // handle code 2
//   })
//   .other(function (e) {
//     // other error code
//   })
// }
// ```

class ChocolateError extends Error {
    type: string
    constructor(message: string) {
        super(message)
        this.type = ""
    }
}

class InternalServerError extends Error {
    inner: any
    constructor(inner: any) {
        super("internal server error")
        this.inner = inner
    }
}

class RequestError<T> extends Error {
    code: number
    message: string

    inner?: T

    handled: boolean

    constructor(code: number, message: string, inner: T | undefined) {
        super(message)
        this.code = code
        this.message = message
        this.handled = false
        this.inner = inner
    }

    isInternalServerError() {
        return false
    }

    handle(code: number, callback: (e: RequestError<T>) => void) {
        if(this.code == code) {
            this.handled = true
            callback(this)
        }
        return this
    }

    other(callback: (e: RequestError<T>) => void) {
        if(!this.handled) {
            callback(this)
        }
    }
}

class OtherError extends Error {
    inner: any
    constructor(inner: any) {
        super("other error")
        this.inner = inner
    }
}

export { InternalServerError, RequestError }
