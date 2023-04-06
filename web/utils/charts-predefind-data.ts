export const getStreamingData = (time: string[], data: number[]) => {
    return {
        labels: time,
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

export const getViewersData = (time: string[], data: number[]) => {
    return {
        labels: time,
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

export const getUsersData = (time: string[], data: number[]) => {
    return {
        labels: time,
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

export const getChatsData = (time: string[], data: number[]) => {
    return {
        labels: time,
        datasets: [{
            label: "chats",
            fill: {
                target: 'origin',
                above: 'rgba(245, 158, 11, 0.1)',
            },
            data: data,
            borderColor: 'rgb(245, 158, 11)',
            tension: 0.4,
        }],
    }
}


export const getNetworkChartData = (time: string[], outbound: number[], inbound: number[]) => {
    return {
        labels: time,
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
                data: inbound.map(v => -v), // Array(180).fill(0).map((_) => -(Math.random() * 1e9 + 1e8)),
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

export const getCpuChartData = (time: string[], data: number[]) => {
    return {
        labels: time,
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

export const getMemChartData = (time: string[], data: number[]) => {
    return {
        labels: time,
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

export const getDiskChartData = (time: string[], read: number[], write: number[]) => {
    return {
        labels: time,
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
                data: write.map(v => -v), // Array(180).fill(0).map((_) => -(Math.random() * 1e9 + 1e8)),
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
