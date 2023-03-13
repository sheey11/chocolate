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
class RequestException extends Error {
    code: number
    message: string

    handled: boolean

    constructor(code: number, message: string) {
        super(message)
        this.code = code
        this.message = message
        this.handled = false
    }

    isInternalServerError() {
        return false
    }

    handle(code: number, callback: (e: RequestException) => void) {
        if(this.code == code) {
            this.handled = true
            callback(this)
        }
        return this
    }

    other(callback: (e: RequestException) => void) {
        if(!this.handled) {
            callback(this)
        }
    }
}

export { RequestException }
