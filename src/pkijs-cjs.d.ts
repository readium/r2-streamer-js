// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/// <reference types="pkijs" />

// ^declare module "pkijs/src/(.+)" \{([\n\s\S]+?)(^\}$)([\n\s]*)
// replace with:
// tslint:disable-next-line: max-line-length
// declare module "pkijs/build/$1" {\n    export * from "pkijs/src/$1";\n    export { default } from "pkijs/src/$1";\n}\n

declare module "pkijs/build/Attribute" {
    export * from "pkijs/src/Attribute";
    export { default } from "pkijs/src/Attribute";
}
declare module "pkijs/build/AttributeTypeAndValue" {
    export * from "pkijs/src/AttributeTypeAndValue";
    export { default } from "pkijs/src/AttributeTypeAndValue";
}
declare module "pkijs/build/AltName" {
    export * from "pkijs/src/AltName";
    export { default } from "pkijs/src/AltName";
}
declare module "pkijs/build/GeneralName" {
    export * from "pkijs/src/GeneralName";
    export { default } from "pkijs/src/GeneralName";
}
declare module "pkijs/build/GeneralNames" {
    export * from "pkijs/src/GeneralNames";
    export { default } from "pkijs/src/GeneralNames";
}
declare module "pkijs/build/AlgorithmIdentifier" {
    export * from "pkijs/src/AlgorithmIdentifier";
    export { default } from "pkijs/src/AlgorithmIdentifier";
}
declare module "pkijs/build/Accuracy" {
    export * from "pkijs/src/Accuracy";
    export { default } from "pkijs/src/Accuracy";
}
declare module "pkijs/build/AccessDescription" {
    export * from "pkijs/src/AccessDescription";
    export { default } from "pkijs/src/AccessDescription";
}
declare module "pkijs/build/AuthorityKeyIdentifier" {
    export * from "pkijs/src/AuthorityKeyIdentifier";
    export { default } from "pkijs/src/AuthorityKeyIdentifier";
}
declare module "pkijs/build/BasicConstraints" {
    export * from "pkijs/src/BasicConstraints";
    export { default } from "pkijs/src/BasicConstraints";
}
declare module "pkijs/build/BasicOCSPResponse" {
    export * from "pkijs/src/BasicOCSPResponse";
    export { default } from "pkijs/src/BasicOCSPResponse";
}
declare module "pkijs/build/CertID" {
    export * from "pkijs/src/CertID";
    export { default } from "pkijs/src/CertID";
}
declare module "pkijs/build/Certificate" {
    export * from "pkijs/src/Certificate";
    export { default } from "pkijs/src/Certificate";
}
declare module "pkijs/build/CertificateChainValidationEngine" {
    export * from "pkijs/src/CertificateChainValidationEngine";
    export { default } from "pkijs/src/CertificateChainValidationEngine";
}
declare module "pkijs/build/CertificatePolicies" {
    export * from "pkijs/src/CertificatePolicies";
    export { default } from "pkijs/src/CertificatePolicies";
}
declare module "pkijs/build/CertificateRevocationList" {
    export * from "pkijs/src/CertificateRevocationList";
    export { default } from "pkijs/src/CertificateRevocationList";
}
declare module "pkijs/build/CertificateSet" {
    export * from "pkijs/src/CertificateSet";
    export { default } from "pkijs/src/CertificateSet";
}
declare module "pkijs/build/CertificationRequest" {
    export * from "pkijs/src/CertificationRequest";
    export { default } from "pkijs/src/CertificationRequest";
}
declare module "pkijs/build/CRLDistributionPoints" {
    export * from "pkijs/src/CRLDistributionPoints";
    export { default } from "pkijs/src/CRLDistributionPoints";
}
declare module "pkijs/build/ContentInfo" {
    export * from "pkijs/src/ContentInfo";
    export { default } from "pkijs/src/ContentInfo";
}
declare module "pkijs/build/CryptoEngine" {
    export * from "pkijs/src/CryptoEngine";
    export { default } from "pkijs/src/CryptoEngine";
}
declare module "pkijs/build/DigestInfo" {
    export * from "pkijs/src/DigestInfo";
    export { default } from "pkijs/src/DigestInfo";
}
declare module "pkijs/build/DistributionPoint" {
    export * from "pkijs/src/DistributionPoint";
    export { default } from "pkijs/src/DistributionPoint";
}
declare module "pkijs/build/ECCCMSSharedInfo" {
    export * from "pkijs/src/ECCCMSSharedInfo";
    export { default } from "pkijs/src/ECCCMSSharedInfo";
}
declare module "pkijs/build/ECPrivateKey" {
    export * from "pkijs/src/ECPrivateKey";
    export { default } from "pkijs/src/ECPrivateKey";
}
declare module "pkijs/build/ECPublicKey" {
    export * from "pkijs/src/ECPublicKey";
    export { default } from "pkijs/src/ECPublicKey";
}
declare module "pkijs/build/EncapsulatedContentInfo" {
    export * from "pkijs/src/EncapsulatedContentInfo";
    export { default } from "pkijs/src/EncapsulatedContentInfo";
}
declare module "pkijs/build/EncryptedContentInfo" {
    export * from "pkijs/src/EncryptedContentInfo";
    export { default } from "pkijs/src/EncryptedContentInfo";
}
declare module "pkijs/build/EncryptedData" {
    export * from "pkijs/src/EncryptedData";
    export { default } from "pkijs/src/EncryptedData";
}
declare module "pkijs/build/EnvelopedData" {
    export * from "pkijs/src/EnvelopedData";
    export { default } from "pkijs/src/EnvelopedData";
}
declare module "pkijs/build/ExtKeyUsage" {
    export * from "pkijs/src/ExtKeyUsage";
    export { default } from "pkijs/src/ExtKeyUsage";
}
declare module "pkijs/build/Extension" {
    export * from "pkijs/src/Extension";
    export { default } from "pkijs/src/Extension";
}
declare module "pkijs/build/Extensions" {
    export * from "pkijs/src/Extensions";
    export { default } from "pkijs/src/Extensions";
}
declare module "pkijs/build/GeneralSubtree" {
    export * from "pkijs/src/GeneralSubtree";
    export { default } from "pkijs/src/GeneralSubtree";
}
declare module "pkijs/build/GeneratorsDriver" {
    export * from "pkijs/src/GeneratorsDriver";
    export { default } from "pkijs/src/GeneratorsDriver";
}
declare module "pkijs/build/InfoAccess" {
    export * from "pkijs/src/InfoAccess";
    export { default } from "pkijs/src/InfoAccess";
}
declare module "pkijs/build/IssuerAndSerialNumber" {
    export * from "pkijs/src/IssuerAndSerialNumber";
    export { default } from "pkijs/src/IssuerAndSerialNumber";
}
declare module "pkijs/build/IssuingDistributionPoint" {
    export * from "pkijs/src/IssuingDistributionPoint";
    export { default } from "pkijs/src/IssuingDistributionPoint";
}
declare module "pkijs/build/KEKIdentifier" {
    export * from "pkijs/src/KEKIdentifier";
    export { default } from "pkijs/src/KEKIdentifier";
}
declare module "pkijs/build/KEKRecipientInfo" {
    export * from "pkijs/src/KEKRecipientInfo";
    export { default } from "pkijs/src/KEKRecipientInfo";
}
declare module "pkijs/build/KeyAgreeRecipientIdentifier" {
    export * from "pkijs/src/KeyAgreeRecipientIdentifier";
    export { default } from "pkijs/src/KeyAgreeRecipientIdentifier";
}
declare module "pkijs/build/KeyAgreeRecipientInfo" {
    export * from "pkijs/src/KeyAgreeRecipientInfo";
    export { default } from "pkijs/src/KeyAgreeRecipientInfo";
}
declare module "pkijs/build/KeyTransRecipientInfo" {
    export * from "pkijs/src/KeyTransRecipientInfo";
    export { default } from "pkijs/src/KeyTransRecipientInfo";
}
declare module "pkijs/build/MacData" {
    export * from "pkijs/src/MacData";
    export { default } from "pkijs/src/MacData";
}
declare module "pkijs/build/MessageImprint" {
    export * from "pkijs/src/MessageImprint";
    export { default } from "pkijs/src/MessageImprint";
}
declare module "pkijs/build/NameConstraints" {
    export * from "pkijs/src/NameConstraints";
    export { default } from "pkijs/src/NameConstraints";
}
declare module "pkijs/build/OCSPRequest" {
    export * from "pkijs/src/OCSPRequest";
    export { default } from "pkijs/src/OCSPRequest";
}
declare module "pkijs/build/OCSPResponse" {
    export * from "pkijs/src/OCSPResponse";
    export { default } from "pkijs/src/OCSPResponse";
}
declare module "pkijs/build/OriginatorIdentifierOrKey" {
    export * from "pkijs/src/OriginatorIdentifierOrKey";
    export { default } from "pkijs/src/OriginatorIdentifierOrKey";
}
declare module "pkijs/build/OriginatorInfo" {
    export * from "pkijs/src/OriginatorInfo";
    export { default } from "pkijs/src/OriginatorInfo";
}
declare module "pkijs/build/OriginatorPublicKey" {
    export * from "pkijs/src/OriginatorPublicKey";
    export { default } from "pkijs/src/OriginatorPublicKey";
}
declare module "pkijs/build/OtherCertificateFormat" {
    export * from "pkijs/src/OtherCertificateFormat";
    export { default } from "pkijs/src/OtherCertificateFormat";
}
declare module "pkijs/build/OtherKeyAttribute" {
    export * from "pkijs/src/OtherKeyAttribute";
    export { default } from "pkijs/src/OtherKeyAttribute";
}
interface JsonOtherPrimeInfo {
    r: string;
    d: string;
    t: string;
}

declare module "pkijs/build/OtherPrimeInfo" {
    export * from "pkijs/src/OtherPrimeInfo";
    export { default } from "pkijs/src/OtherPrimeInfo";
}
declare module "pkijs/build/OtherRecipientInfo" {
    export * from "pkijs/src/OtherRecipientInfo";
    export { default } from "pkijs/src/OtherRecipientInfo";
}
declare module "pkijs/build/OtherRevocationInfoFormat" {
    export * from "pkijs/src/OtherRevocationInfoFormat";
    export { default } from "pkijs/src/OtherRevocationInfoFormat";
}
declare module "pkijs/build/PasswordRecipientinfo" {
    export * from "pkijs/src/PasswordRecipientinfo";
    export { default } from "pkijs/src/PasswordRecipientinfo";
}
declare module "pkijs/build/PBES2Params" {
    export * from "pkijs/src/PBES2Params";
    export { default } from "pkijs/src/PBES2Params";
}
declare module "pkijs/build/PBKDF2Params" {
    export * from "pkijs/src/PBKDF2Params";
    export { default } from "pkijs/src/PBKDF2Params";
}
declare module "pkijs/build/PKIStatusInfo" {
    export * from "pkijs/src/PKIStatusInfo";
    export { default } from "pkijs/src/PKIStatusInfo";
}
declare module "pkijs/build/PolicyConstraints" {
    export * from "pkijs/src/PolicyConstraints";
    export { default } from "pkijs/src/PolicyConstraints";
}
declare module "pkijs/build/PolicyInformation" {
    export * from "pkijs/src/PolicyInformation";
    export { default } from "pkijs/src/PolicyInformation";
}
declare module "pkijs/build/PolicyMapping" {
    export * from "pkijs/src/PolicyMapping";
    export { default } from "pkijs/src/PolicyMapping";
}
declare module "pkijs/build/PolicyMappings" {
    export * from "pkijs/src/PolicyMappings";
    export { default } from "pkijs/src/PolicyMappings";
}
declare module "pkijs/build/PolicyQualifierInfo" {
    export * from "pkijs/src/PolicyQualifierInfo";
    export { default } from "pkijs/src/PolicyQualifierInfo";
}
declare module "pkijs/build/PrivateKeyInfo" {
    export * from "pkijs/src/PrivateKeyInfo";
    export { default } from "pkijs/src/PrivateKeyInfo";
}
declare module "pkijs/build/PrivateKeyUsagePeriod" {
    export * from "pkijs/src/PrivateKeyUsagePeriod";
    export { default } from "pkijs/src/PrivateKeyUsagePeriod";
}
declare module "pkijs/build/PublicKeyInfo" {
    export * from "pkijs/src/PublicKeyInfo";
    export { default } from "pkijs/src/PublicKeyInfo";
}
declare module "pkijs/build/RecipientEncryptedKey" {
    export * from "pkijs/src/RecipientEncryptedKey";
    export { default } from "pkijs/src/RecipientEncryptedKey";
}
declare module "pkijs/build/RecipientEncryptedKeys" {
    export * from "pkijs/src/RecipientEncryptedKeys";
    export { default } from "pkijs/src/RecipientEncryptedKeys";
}
declare module "pkijs/build/RecipientIdentifier" {
    export * from "pkijs/src/RecipientIdentifier";
    export { default } from "pkijs/src/RecipientIdentifier";
}
declare module "pkijs/build/RecipientInfo" {
    export * from "pkijs/src/RecipientInfo";
    export { default } from "pkijs/src/RecipientInfo";
}
declare module "pkijs/build/RecipientKeyIdentifier" {
    export * from "pkijs/src/RecipientKeyIdentifier";
    export { default } from "pkijs/src/RecipientKeyIdentifier";
}
declare module "pkijs/build/RelativeDistinguishedNames" {
    export * from "pkijs/src/RelativeDistinguishedNames";
    export { default } from "pkijs/src/RelativeDistinguishedNames";
}
declare module "pkijs/build/Request" {
    export * from "pkijs/src/Request";
    export { default } from "pkijs/src/Request";
}
declare module "pkijs/build/ResponseBytes" {
    export * from "pkijs/src/ResponseBytes";
    export { default } from "pkijs/src/ResponseBytes";
}
declare module "pkijs/build/ResponseData" {
    export * from "pkijs/src/ResponseData";
    export { default } from "pkijs/src/ResponseData";
}
declare module "pkijs/build/RevocationInfoChoices" {
    export * from "pkijs/src/RevocationInfoChoices";
    export { default } from "pkijs/src/RevocationInfoChoices";
}
declare module "pkijs/build/RevokedCertificate" {
    export * from "pkijs/src/RevokedCertificate";
    export { default } from "pkijs/src/RevokedCertificate";
}
declare module "pkijs/build/RSAESOAEPParams" {
    export * from "pkijs/src/RSAESOAEPParams";
    export { default } from "pkijs/src/RSAESOAEPParams";
}
declare module "pkijs/build/RSAPrivateKey" {
    export * from "pkijs/src/RSAPrivateKey";
    export { default } from "pkijs/src/RSAPrivateKey";
}
declare module "pkijs/build/RSAPublicKey" {
    export * from "pkijs/src/RSAPublicKey";
    export { default } from "pkijs/src/RSAPublicKey";
}
declare module "pkijs/build/RSASSAPSSParams" {
    export * from "pkijs/src/RSASSAPSSParams";
    export { default } from "pkijs/src/RSASSAPSSParams";
}
declare module "pkijs/build/Signature" {
    export * from "pkijs/src/Signature";
    export { default } from "pkijs/src/Signature";
}
declare module "pkijs/build/SignedAndUnsignedAttributes" {
    export * from "pkijs/src/SignedAndUnsignedAttributes";
    export { default } from "pkijs/src/SignedAndUnsignedAttributes";
}
declare module "pkijs/build/SignedData" {
    export * from "pkijs/src/SignedData";
    export { default } from "pkijs/src/SignedData";
}
declare module "pkijs/build/SignerInfo" {
    export * from "pkijs/src/SignerInfo";
    export { default } from "pkijs/src/SignerInfo";
}
declare module "pkijs/build/SingleResponse" {
    export * from "pkijs/src/SingleResponse";
    export { default } from "pkijs/src/SingleResponse";
}
declare module "pkijs/build/SubjectDirectoryAttributes" {
    export * from "pkijs/src/SubjectDirectoryAttributes";
    export { default } from "pkijs/src/SubjectDirectoryAttributes";
}
declare module "pkijs/build/TBSRequest" {
    export * from "pkijs/src/TBSRequest";
    export { default } from "pkijs/src/TBSRequest";
}
declare module "pkijs/build/Time" {
    export * from "pkijs/src/Time";
    export { default } from "pkijs/src/Time";
}
declare module "pkijs/build/TimeStampReq" {
    export * from "pkijs/src/TimeStampReq";
    export { default } from "pkijs/src/TimeStampReq";
}
declare module "pkijs/build/TimeStampResp" {
    export * from "pkijs/src/TimeStampResp";
    export { default } from "pkijs/src/TimeStampResp";
}
declare module "pkijs/build/TSTInfo" {
    export * from "pkijs/src/TSTInfo";
    export { default } from "pkijs/src/TSTInfo";
}
declare module "pkijs/build/common" {
    export * from "pkijs/src/common";
    // export { default } from "pkijs/src/common";
}
