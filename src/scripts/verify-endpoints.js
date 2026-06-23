async function run() {
  console.log('--- Querying Running Server Health ---');
  try {
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    console.log('Health response:', data);

    if (data.status === 'ok') {
      console.log('✅ Backend health check passed.');
    } else {
      console.error('❌ Unexpected health response:', data);
    }
  } catch (err) {
    console.error('❌ Health check request failed:', err.message);
  }
}

run();
