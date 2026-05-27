# Security & Privacy Guidelines for LifeVault

## 🔒 Critical Security Considerations

LifeVault handles extremely sensitive personal and financial information. Security is **non-negotiable**.

---

## Data Classification & Encryption

### **Tier 1: Highly Sensitive** (Must Encrypt)
- Social Security Numbers
- Bank Account Numbers
- Credit Card Information
- Tax Returns (sensitive financial data)
- Medical Records
- PIN Numbers

**Encryption Method**: AES-256-GCM at rest and in transit

### **Tier 2: Sensitive** (Encrypt + Access Control)
- Full Names with birthdates
- Contact Information
- Family Relationships
- Asset Information
- Will/Legacy Instructions

**Encryption Method**: AES-256-GCM + role-based access

### **Tier 3: Personal** (Secure Access Logs)
- User Preferences
- Profile Information
- App Settings

**Encryption Method**: TLS 1.3 in transit only

---

## End-to-End Encryption (E2EE)

### Implementation
```javascript
// Example: Encrypting SSN before storage
const crypto = require('crypto');

function encryptSSN(ssn, masterKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(masterKey), iv);
  
  let encrypted = cipher.update(ssn, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

function decryptSSN(encryptedData, masterKey) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(masterKey), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## Authentication & Access Control

### Multi-Factor Authentication (MFA)
- **Required for**: Account login, accessing sensitive data
- **Methods**: 
  - TOTP (Time-based One-Time Password) via authenticator apps
  - SMS 2FA (backup)
  - Email verification

### Role-Based Access Control (RBAC)
```javascript
// User Roles
const ROLES = {
  OWNER: 'owner',           // Full account control
  EXECUTOR: 'executor',     // Access after owner death
  VIEWER: 'viewer',         // Read-only access to specific docs
  FAMILY_MEMBER: 'family'   // Limited access to own info
};

// Permissions per role
const PERMISSIONS = {
  owner: ['create', 'read', 'update', 'delete', 'share', 'execute_legacy'],
  executor: ['read', 'execute_legacy'], // Activated on death
  viewer: ['read'],
  family: ['read_own'] // Only their own data
};
```

---

## Data Access Logging & Audit Trail

Every access to sensitive data must be logged:

```javascript
// Audit Log Schema
{
  logId: uuid(),
  userId: 'user123',
  accessedBy: 'executor456',
  dataType: 'vault.ssn',
  action: 'READ',
  timestamp: new Date(),
  ipAddress: '192.168.1.1',
  deviceInfo: 'iPhone iOS 17',
  reason: 'executor_access_after_death',
  status: 'SUCCESS' | 'FAILED'
}
```

### User Access Alerts
- Alert owner when non-owner accesses sensitive data
- Show access history in dashboard
- Allow owner to revoke access

---

## Network Security

### HTTPS/TLS Requirements
```bash
# Minimum TLS 1.3
# Certificate: Let's Encrypt (auto-renewing)
# HSTS: max-age=31536000; includeSubDomains
```

### CORS Configuration
```javascript
// Only allow mobile app and trusted domains
const corsOptions = {
  origin: [
    'https://lifevault.app',
    'exp://your-expo-project.expo.dev'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### API Rate Limiting
```javascript
// Prevent brute force attacks
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

---

## Database Security (Firebase/MongoDB)

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only owner can access their vault
    match /vault/{vaultId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
    }
    
    // Executors can only read after activation
    match /legacy/{legacyId} {
      allow read: if request.auth.uid == resource.data.userId 
                   || (request.auth.uid in resource.data.executors 
                       && resource.data.isActivated == true);
      allow write: if request.auth.uid == resource.data.userId;
    }
    
    // Audit logs are append-only
    match /auditLogs/{logId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if true; // Server creates these
      allow update, delete: if false;
    }
  }
}
```

---

## Data Retention & Deletion

### Deletion Policy
- **Owner Request**: Delete account + all data within 30 days
- **Inactivity**: Account dormant for 5 years → notify, then delete
- **Upon Death**: Legacy data accessible by executor, deleted after 10 years

### GDPR Compliance
- Right to access: Users can export their data in 48 hours
- Right to be forgotten: Complete data deletion available
- Data Portability: Export all data in standard format (JSON)

```javascript
// User data export endpoint
app.get('/api/users/export-data', async (req, res) => {
  const userId = req.user.id;
  
  const userData = await Promise.all([
    getVaultData(userId),
    getLegacyData(userId),
    getAuditLogs(userId)
  ]);
  
  const jsonExport = {
    export_date: new Date(),
    vault: userData[0],
    legacy: userData[1],
    audit_logs: userData[2]
  };
  
  res.json(jsonExport);
});
```

---

## Third-Party Integrations Security

### Email Service (Legacy Letters)
- Use SendGrid with API key authentication
- Never store credentials in code
- Log all email delivery attempts
- Verify email delivery with webhooks

### Payment Processing (RevenueCat)
- Never handle raw payment data
- Use RevenueCat API tokens only
- Store subscription status in secure database
- Validate receipts server-side

---

## Security Best Practices Checklist

- [ ] **Dependencies**: Update weekly, use npm audit
- [ ] **Secrets Management**: Use environment variables, never commit secrets
- [ ] **Input Validation**: Sanitize all user inputs (SSN format, email, etc.)
- [ ] **SQL Injection Prevention**: Use parameterized queries/Firestore queries
- [ ] **XSS Prevention**: Sanitize outputs, use Content Security Policy headers
- [ ] **CSRF Protection**: CSRF tokens for state-changing operations
- [ ] **Secure Headers**: Implement security headers (X-Frame-Options, X-Content-Type-Options)
- [ ] **Password Policy**: Min 12 chars, complexity requirements, no common passwords
- [ ] **Session Management**: 30-minute timeout, secure cookies (HttpOnly, Secure, SameSite)
- [ ] **Penetration Testing**: Conduct quarterly security audits
- [ ] **Privacy Policy**: Clear and compliant with GDPR/CCPA
- [ ] **Terms of Service**: Address liability and data usage

---

## Incident Response Plan

### Data Breach Protocol
1. **Immediate**: Isolate affected systems (within 1 hour)
2. **Investigation**: Determine scope and impact (within 24 hours)
3. **Notification**: Notify affected users (within 72 hours)
4. **Remediation**: Fix vulnerability and deploy patch
5. **Review**: Post-incident analysis and process improvements

---

## Compliance Requirements

### HIPAA (Medical Records)
- Business Associate Agreements (BAA) with vendors
- Audit controls on medical data access
- Minimum necessary access principle
- Annual security risk assessment

### GDPR (European Users)
- Lawful basis for processing (consent)
- Data Protection Officer (DPO) appointment
- DPIA (Data Protection Impact Assessment)
- Right to erasure implementation

### CCPA (California Users)
- Privacy policy disclosure
- Opt-out mechanisms
- Deletion on request (within 45 days)

---

## Regular Security Maintenance

- **Weekly**: Dependency updates, vulnerability scans
- **Monthly**: Security audit logs review, access control verification
- **Quarterly**: Penetration testing, security training
- **Annually**: Full security audit, compliance review

---

## Contact & Reporting

**Security Issues**: security@lifevault.app (use PGP key)

**Do NOT create public GitHub issues for security vulnerabilities**

---

**Last Updated**: May 2026
**Next Review**: May 2027
