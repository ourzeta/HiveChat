type DebouncedFunction<T extends any[]> = (...args: T) => void;
export function debounce<T extends any[]>(
    func: (...args: T) => void,
    wait: number
): DebouncedFunction<T> {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: T) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args)
        }, wait)
    }
}

export function asyncDebounce<T extends any[], R>(func: (...args: T) => Promise<R>, wait: number): (...args: T) => Promise<R> {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: T) => {
        if (timeout) clearTimeout(timeout);
        return new Promise((resolve, reject) => {
            timeout = setTimeout(async () => {
                try {
                    const result = await func(...args);
                    resolve(result);
                } catch (error) {
                    reject(error)
                }
            }, wait)
        })
    }
}
