export class ResponseDto<T> {
    success: boolean;
    message: string;
    data?: T

    constructor(success: boolean,
        message: string,
        data?: T
    ) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}

export class SuccessResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;

    constructor(message: string, data?: T) {
        this.success = true;
        this.message = message;
        this.data = data;
    }
}