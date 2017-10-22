export interface IStringMap { [key: string]: string; }

export const getURLQueryParams = (search?: string): IStringMap => {
    const params: IStringMap = {};

    let query = search || window.location.search;
    if (query && query.length) {
        query = query.substring(1);
        const keyParams = query.split("&");
        keyParams.forEach((keyParam) => {
            const keyVal = keyParam.split("=");
            if (keyVal.length > 1) {
                params[keyVal[0]] = decodeURIComponent(keyVal[1]);
            }
        });
    }

    return params;
};
