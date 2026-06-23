async function run() {
  const loginRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gaurav.20249013@mnnit.ac.in', password: 'gaurav' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  const verifyRes = await fetch('http://localhost:5001/api/auth/users/6a395706e028eeec7b957ab1/verify', {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({})
  });
  const verifyText = await verifyRes.text();
  console.log("Verify Response:", verifyRes.status, verifyText);
}
run();
