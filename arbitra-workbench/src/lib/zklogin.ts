import { generateNonce, generateRandomness } from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const REDIRECT_URI = "http://localhost:3000/auth/callback";

export async function startGoogleLogin() {
  const client = new SuiJsonRpcClient({
    url: "https://fullnode.testnet.sui.io",
    network: "testnet",
  });

  const { epoch } = await client.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + 2;
  const randomness = generateRandomness();
  const ephemeralKeypair = new Ed25519Keypair();
  const nonce = generateNonce(
    ephemeralKeypair.getPublicKey(),
    maxEpoch,
    randomness
  );

  sessionStorage.setItem("zklogin_randomness", randomness.toString());
  sessionStorage.setItem("zklogin_max_epoch", maxEpoch.toString());
  sessionStorage.setItem(
    "zklogin_ephemeral_key",
    ephemeralKeypair.getSecretKey()
  );

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "id_token",
    scope: "openid email profile",
    nonce,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
