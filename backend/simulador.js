// simulador.js (usando fetch, que é nativo do Node.js)

const API_URL = 'http://localhost:3000/api/v1/telemetry/iot-data';
const DEVICE_ID = 'SIMULADOR-TESTE-01';
const INTERVALO_MS = 8000;

function gerarDadosFalsos() {
    // ... (a função de gerar dados continua exatamente a mesma) ...
    const dados = {
        deviceId: DEVICE_ID,
        timestamp: new Date().toISOString(),
        temperatura: parseFloat((Math.random() * 10 + 15).toFixed(2)),
        umidade: parseFloat((Math.random() * 20 + 50).toFixed(2)),
        pressao_hpa: parseFloat((Math.random() * 10 + 1010).toFixed(2)),
        latitude: -23.55 + (Math.random() - 0.5) * 0.01,
        longitude: -46.63 + (Math.random() - 0.5) * 0.01,
    };
    return dados;
}

async function enviarDados() {
    const pacoteDeDados = gerarDadosFalsos();
    console.log('Enviando para a API:', pacoteDeDados);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pacoteDeDados), // Converte o objeto JS para uma string JSON
        });

        const responseData = await response.json(); // Lê a resposta da API
        console.log('Resposta da API:', response.status, responseData);

    } catch (error) {
        console.error('Erro ao contatar a API:', error.message);
    }
}

console.log(`--- Simulador de IoT iniciado. Enviando dados a cada ${INTERVALO_MS / 1000} segundos para ${API_URL} ---`);
enviarDados();
setInterval(enviarDados, INTERVALO_MS);