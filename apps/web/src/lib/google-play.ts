import crypto from 'node:crypto'

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: process.env.GOOGLE_PLAY_PROJECT_ID!,
  private_key_id: process.env.GOOGLE_PLAY_PRIVATE_KEY_ID!,
  private_key: (process.env.GOOGLE_PLAY_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_PLAY_CLIENT_EMAIL!,
}

function base64url(str: string): string {
  return Buffer.from(str).toString('base64url')
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claimSet = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = base64url(JSON.stringify(header))
  const encodedClaimSet = base64url(JSON.stringify(claimSet))
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signatureInput)
  const signature = signer.sign(SERVICE_ACCOUNT.private_key, 'base64url')

  const jwt = `${signatureInput}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

export async function addEmailToGooglePlayTesters(userEmail: string): Promise<void> {
  try {
    const packageName = "com.screenly.app"
    const token = await getAccessToken()

    const createEditRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    )

    const editData = await createEditRes.json()
    if (!createEditRes.ok) {
      console.error("[Google Play API] Edit session creation failed:", editData)
      return
    }

    const editId = editData.id

    // Fetch existing testers for 'internal' track
    const getTestersRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/testers/internal`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    let currentGroups: string[] = []
    if (getTestersRes.ok) {
      const testersData = await getTestersRes.json()
      currentGroups = testersData.googleGroups || []
    }

    if (!currentGroups.includes(userEmail)) {
      currentGroups.push(userEmail)
    }

    // Update testers list
    const updateRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/testers/internal`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleGroups: currentGroups,
        }),
      }
    )

    if (!updateRes.ok) {
      const updateError = await updateRes.json()
      console.error("[Google Play API] Failed to update testers:", updateError)
      return
    }

    // Commit edit session
    const commitRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}:commit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (commitRes.ok) {
      console.log(`[Google Play API] Successfully added ${userEmail} to testers list!`)
    } else {
      console.error("[Google Play API] Failed to commit edit session:", await commitRes.json())
    }
  } catch (err) {
    console.error("[Google Play API Error]", err)
  }
}
