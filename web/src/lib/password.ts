const PASSWORD_CHARSETS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%^&*_-+=?",
];

export function generateSecurePassword(length = 18) {
  const chars = PASSWORD_CHARSETS.join("");
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);

  const required = PASSWORD_CHARSETS.map((set, index) => {
    const byte = bytes[index] ?? 0;
    return set[byte % set.length];
  });

  const rest = Array.from(bytes.slice(required.length), (byte) => chars[byte % chars.length]);
  const password = [...required, ...rest];

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = bytes[index] % (index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }

  return password.join("");
}
