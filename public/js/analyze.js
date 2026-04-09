// Parse data safely from EJS
const chartData = JSON.parse(document.getElementById('data-json').textContent);
console.log("Chart Data in browser:", chartData);

if (!chartData || chartData.length === 0) {
    console.log("No data available to plot.");
} else {

    // Convert fields to numeric arrays
    const labelsArr = chartData.map(d => new Date(d.timestamp).toLocaleTimeString());
    const observedBrixArr = chartData.map(d => Number(d.observed_brix) || 0);
    const tempArr = chartData.map(d => Number(d.temp) || 0);
    const correctedBrixArr = chartData.map(d => Number(d.corrected_brix) || 0);
    const correctedPolArr = chartData.map(d => Number(d.corrected_pol) || 0);
    const normalRecoveryArr = chartData.map(d => Number(d.normal_recovery) || 0);

    console.log("Observed Brix:", observedBrixArr);
    console.log("Temperature:", tempArr);
    console.log("Corrected Brix:", correctedBrixArr);
    console.log("Corrected Pol:", correctedPolArr);
    console.log("Normal Recovery:", normalRecoveryArr);

    // 1️⃣ Observed Brix vs Temperature
    if (document.getElementById('brixTempChart')) {
        new Chart(document.getElementById('brixTempChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labelsArr,
                datasets: [
                    { label: 'Observed Brix', data: observedBrixArr, borderColor: 'blue', backgroundColor: 'rgba(0,0,255,0.1)', fill: true, yAxisID: 'y1', tension: 0.2 },
                    { label: 'Temperature', data: tempArr, borderColor: 'red', backgroundColor: 'rgba(255,0,0,0.1)', fill: true, yAxisID: 'y2', tension: 0.2 }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                return "Time: " + labelsArr[index];
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const brix = observedBrixArr[index];
                                const temp = tempArr[index];
                                return `Brix: ${brix}, Temp: ${temp}`;
                            }
                        }
                    }
                },
                stacked: false,
                scales: {
                    y1: { type: 'linear', position: 'left', title: { display: true, text: 'Brix' } },
                    y2: { type: 'linear', position: 'right', title: { display: true, text: 'Temperature (°C)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    // 2️⃣ Corrected Brix vs Normal Recovery
    if (document.getElementById('correctedBrixRecoveryChart')) {
        new Chart(document.getElementById('correctedBrixRecoveryChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labelsArr,
                datasets: [
                    { label: 'Corrected Brix', data: correctedBrixArr, borderColor: 'green', backgroundColor: 'rgba(0,128,0,0.1)', fill: true, tension: 0.2 },
                    { label: 'Normal Recovery', data: normalRecoveryArr, borderColor: 'orange', backgroundColor: 'rgba(255,165,0,0.1)', fill: true, tension: 0.2 }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                return "Time: " + labelsArr[index];
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const brix = correctedBrixArr[index];
                                const recovery = normalRecoveryArr[index];
                                return `Brix: ${brix}, Recovery: ${recovery}`;
                            }
                        }
                    }
                },
                scales: { y: { title: { display: true, text: 'Value' } } }
            }
        });
    }

    // 3️⃣ Corrected Pol vs Normal Recovery
    if (document.getElementById('correctedPolRecoveryChart')) {
        new Chart(document.getElementById('correctedPolRecoveryChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labelsArr,
                datasets: [
                    { label: 'Corrected Pol', data: correctedPolArr, borderColor: 'purple', backgroundColor: 'rgba(128,0,128,0.1)', fill: true, tension: 0.2 },
                    { label: 'Normal Recovery', data: normalRecoveryArr, borderColor: 'orange', backgroundColor: 'rgba(255,165,0,0.1)', fill: true, tension: 0.2 }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                return "Time: " + labelsArr[index];
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const pol = correctedPolArr[index];
                                const recovery = normalRecoveryArr[index];
                                return `Pol: ${pol}, Recovery: ${recovery}`;
                            }
                        }
                    }
                },
                scales: { y: { title: { display: true, text: 'Value' } } }
            }
        });
    }
}
