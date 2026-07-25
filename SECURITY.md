# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in FlowShip SG, please report it responsibly by emailing the maintainers directly rather than using the public issue tracker.

### Guidelines:
- **Do not** create a public GitHub issue for security vulnerabilities
- Include a detailed description of the vulnerability
- Include steps to reproduce (if applicable)
- Allow time for the maintainers to respond and develop a fix

## Security Best Practices

When using FlowShip SG:

- Keep your dependencies up to date
- Rotate your API keys and credentials regularly
- Use strong, unique passwords
- Store sensitive information in environment variables, never in code
- Use `.env.local` for local development with `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL`

## Dependencies

We regularly review and update our dependencies to address known vulnerabilities. Running `npm audit` will help identify any security issues in your local setup.

## Support

For security questions or concerns, please reach out through the appropriate channels in the Base44 support documentation.
