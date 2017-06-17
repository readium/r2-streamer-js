interface IStringKeyedObject { [key: string]: any; }

export function sortObject(obj: any): any {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sortObject(obj[i]);
        }
        return obj;
    } else if (typeof obj !== "object") {
        return obj;
    }

    const newObj: IStringKeyedObject = {};

    Object.keys(obj).sort().forEach((key) => {
        newObj[key] = sortObject(obj[key]);
    });

    return newObj;
}

export function traverseJsonObjects(obj: any, func: (item: any) => void) {
    func(obj);

    if (obj instanceof Array) {
        obj.forEach((item) => {
            if (item) {
                traverseJsonObjects(item, func);
            }
        });
    } else if (typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
            if (obj.hasOwnProperty(key) && obj[key]) {
                traverseJsonObjects(obj[key], func);
            }
        });
    }
}
