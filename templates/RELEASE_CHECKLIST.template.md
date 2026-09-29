# Release / Beta Checklist

## Build
- [ ] Reproducible release build
- [ ] Version/build numbers correct
- [ ] Production environment configured
- [ ] No debug credentials/secrets

## Functional
- [ ] Primary flow smoke tested
- [ ] Account lifecycle tested
- [ ] Error/retry paths tested
- [ ] Deep links/notifications tested if applicable

## Security/privacy
- [ ] Auth/authorization verified
- [ ] Sensitive local storage reviewed
- [ ] Dependency/security review complete
- [ ] Privacy disclosures match actual data collection
- [ ] Account deletion/export requirements handled when applicable

## Mobile store policy
- [ ] Current Apple rules checked
- [ ] Current Google Play rules checked
- [ ] Permissions justified
- [ ] UGC moderation/report/block if applicable
- [ ] Digital payments compliant if applicable

## Operations
- [ ] Crash/error visibility
- [ ] Analytics verified
- [ ] Rollback/hotfix path
- [ ] Database migration/rollback plan
- [ ] Support/feedback path

## Beta measurement
- [ ] Primary value event defined
- [ ] Activation metric defined
- [ ] Retention/return signal defined
- [ ] Failure thresholds defined
