export const getStreamingData = (data: number[]) => {
    return {
        labels: Array(data.length).fill(0),
        datasets: [{
            label: "streaming",
            fill: {
                target: 'origin',
                above: 'rgba(37, 99, 235, 0.1)',
            },
            data: data,
            borderColor: 'rgb(37, 99, 235)',
            tension: 0.4,
        }],
    }
}

export const getViewersData = (data: number[]) => {
    return {
        labels: Array(data.length).fill(0),
        datasets: [{
            label: "viewers",
            fill: {
                target: 'origin',
                above: 'rgba(220, 38, 38, 0.1)',
            },
            data: data,
            borderColor: 'rgb(220, 38, 38)',
            tension: 0.4,
        }],
    }
}

export const getUsersData = (data: number[]) => {
    return {
        labels: Array(data.length).fill(0),
        datasets: [{
            label: "users",
            fill: {
                target: 'origin',
                above: 'rgba(22, 163, 74, 0.1)',
            },
            data: data,
            borderColor: 'rgb(22, 163, 74)',
            tension: 0.4,
        }],
    }
}

export const getNetworkData = (outbound: number[], inbound: number[]) => {
    return {
        labels: Array(outbound.length).fill(0),
        datasets: [
            {
                label: 'outbound',
                data: outbound, // Array(180).fill(0).map((_) => Math.random() * 1e9 + 1e8),
                tension: 0,
                borderColor: 'rgb(139, 92, 246)',
                fill: {
                    target: 'origin',
                    above: 'rgba(139, 92, 246, 0.1)',
                },
            },
            {
                label: 'inbound',
                data: inbound, // Array(180).fill(0).map((_) => -(Math.random() * 1e9 + 1e8)),
                tension: 0,
                borderColor: 'rgb(20, 184, 166)',
                fill: {
                    target: 'origin',
                    below: 'rgba(20, 184, 166, 0.1)',
                },
            }
        ],
    }
}

export const getCpuData = (data: number[]) => {
    return {
        labels: Array(data.length).fill(0),
        datasets: [
            {
                label: 'CPU',
                data: data, // Array(180).fill(0).map((_) => Math.random()),
                tesion: 0,
                borderColor: 'rgb(244, 63, 94)',
                fill: {
                    target: 'origin',
                    above: 'rgba(244, 63, 94, 0.1)',
                },
            }
        ]
    }
}

export const getMemData = (data: number[]) => {
    return {
        labels: Array(data.length).fill(0),
        datasets: [
            {
                label: 'memory',
                data: data, //Array(180).fill(0).map((_) => Math.random()),
                tesion: 0,
                borderColor: 'rgb(251, 191, 36)',
                fill: {
                    target: 'origin',
                    above: 'rgba(251, 191, 36, 0.1)',
                },
            }
        ]
    }
}

export const getDiskData = (read: number[], write: number[]) => {
    return {
        labels: Array(read.length).fill(0),
        datasets: [
            {
                label: 'disk_read',
                data: read, // Array(180).fill(0).map((_) => Math.random() * 1e9 + 1e8),
                tesion: 0,
                borderColor: 'rgb(139, 92, 246)',
                fill: {
                    target: 'origin',
                    above: 'rgba(139, 92, 246, 0.1)',
                },
            },
            {
                label: 'disk_write',
                data: write, // Array(180).fill(0).map((_) => -(Math.random() * 1e9 + 1e8)),
                tesion: 0,
                borderColor: 'rgb(20, 184, 166)',
                fill: {
                    target: 'origin',
                    below: 'rgba(20, 184, 166, 0.1)',
                },
            }
        ]
    }
}
