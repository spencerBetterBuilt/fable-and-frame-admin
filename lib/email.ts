// TODO: wire up transactional email (Resend or similar). V1 stub logs intended sends only.
export function sendEmailStub(to: string, subject: string, body: string) {
  console.log(`[email stub] to=${to} subject="${subject}"\n${body}`);
}
