

interface numberBox {
    value: number
}

const box: numberBox ={ value : 10}


interface stringBox {
    value: string
}

const sbox: stringBox = { value : "hey"}

interface Box<T> {
    value: T
}