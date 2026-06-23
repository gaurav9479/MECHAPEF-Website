async function run() {
  const loginRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gaurav.20249013@mnnit.ac.in', password: 'gaurav' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  // Re-verify without body
  console.log("\nRe-verifying (no body)...");
  const reverifyNoBodyRes = await fetch('http://localhost:5001/api/auth/users/6a3a2cfac94d7d993155d559/verify', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    // no body!
  });
  console.log("Reverify No Body:", reverifyNoBodyRes.status, await reverifyNoBodyRes.text());

}
run();
