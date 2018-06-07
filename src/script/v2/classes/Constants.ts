import * as multer from "multer";

export abstract class Constant {
    public static Multer = multer({ dest: "/tmp/" });
}

/**
 * Declare response interface
 */
export interface UpdateResponse {
    n: number,
    nModified: number,
    ok: number
}


