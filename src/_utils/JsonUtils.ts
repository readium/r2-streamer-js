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

function traverseJsonObjects_(
    parent: any, keyInParent: any, obj: any,
    func: (item: any, parent: any, keyInParent: any) => void) {

    func(obj, parent, keyInParent);

    if (obj instanceof Array) {
        for (let index = 0; index < obj.length; index++) {
            const item = obj[index];
            if (typeof item !== "undefined") {
                traverseJsonObjects_(obj, index, item, func);
            }
        }
    } else if (typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
            if (obj.hasOwnProperty(key)) {
                const item = obj[key];
                if (typeof item !== "undefined") {
                    traverseJsonObjects_(obj, key, item, func);
                }
            }
        });
    }
}

export function traverseJsonObjects(
    obj: any,
    func: (item: any, parent: any, keyInParent: any) => void) {

    traverseJsonObjects_(undefined, undefined, obj, func);
}
