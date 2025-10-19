using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Skylock.Aggregate.Base;
using Skylock.Database.Models;
using Skylock.Enum;
using Skylock.UnitsOfWorks.Base;
using System;
using System.IO;
using System.Security.Cryptography;

namespace Skylock.Aggregate
{
    public class LocalStorageAggregate : StorageAggregate
    {
        public string StoragePath;
        private readonly byte[] _aesKey;

        public LocalStorageAggregate(IConfiguration configuration)
        {
            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration));
            }
            StoragePath = configuration["LocalStorage:BasePath"];

            var keyB64 = configuration["Encryption:AesKeyBase64"];
            if (string.IsNullOrWhiteSpace(keyB64))
                throw new InvalidOperationException("Missing config: Encryption:AesKeyBase64 (Base64).");

            try
            {
                _aesKey = Convert.FromBase64String(keyB64);
            }
            catch (FormatException ex)
            {
                throw new InvalidOperationException("Encryption:AesKeyBase64 must be Base64.", ex);
            }

            if (!(_aesKey.Length == 16 || _aesKey.Length == 24 || _aesKey.Length == 32))
                throw new InvalidOperationException("AES key must be 16/24/32 bytes (Base64-encoded).");
        }

        public static StorageAggregate? CreateOrDefault(string storageAggregateType, IConfiguration configuration)
        {
            if (storageAggregateType == "0")
            {
                return new LocalStorageAggregate(configuration);
            }
            return null;
        }

        public override string SaveFile(IFormFile file, string targetFileName, User user)
        {
            if (file == null) throw new ArgumentNullException(nameof(file));
            if (file.Length == 0) throw new ArgumentException("File is empty.", nameof(file));
            if (string.IsNullOrWhiteSpace(StoragePath))
                throw new InvalidOperationException("LocalStorage:BasePath is not configured.");

            Directory.CreateDirectory(StoragePath);
            var userDirectoryPath = Path.Combine(StoragePath, user.KeycloakId);

            Directory.CreateDirectory(userDirectoryPath);

            var filePath = Path.Combine(StoragePath,user.KeycloakId, targetFileName);

            using var input = file.OpenReadStream();
            using var output = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, bufferSize: 64 * 1024);

            using var aes = Aes.Create();
            aes.Key = _aesKey;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            aes.GenerateIV(); // losowy IV per plik

            // Prefix: IV (16 bajtów)
            output.Write(aes.IV, 0, aes.IV.Length);

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            using var crypto = new CryptoStream(output, encryptor, CryptoStreamMode.Write);

            // Strumieniowo szyfrujemy zawartość
            input.CopyTo(crypto);
            crypto.FlushFinalBlock();

            return filePath;
        }

        public override Stream DownloadFile(FileDTO fileInfo, User user)
        {
            var filePath = Path.Combine(StoragePath, user.KeycloakId, fileInfo.FileId);

            if (!System.IO.File.Exists(filePath))
                throw new FileNotFoundException("Encrypted file not found.", filePath);

            var fs = new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 64 * 1024,
                options: FileOptions.SequentialScan);

            try
            {
                // Odczytaj IV (16 bajtów) z początku pliku
                var iv = new byte[16];
                int read = fs.Read(iv, 0, iv.Length);
                if (read != iv.Length)
                {
                    fs.Dispose();
                    throw new InvalidDataException("Invalid encrypted file header (IV).");
                }

                // Utwórz strumień deszyfrujący (READ)
                var aes = Aes.Create();
                aes.Key = _aesKey;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                var decryptor = aes.CreateDecryptor(aes.Key, iv);

                // CryptoStream zwrócony do kontrolera; jego Dispose zamknie także FileStream i decryptor
                var cryptoStream = new CryptoStream(fs, decryptor, CryptoStreamMode.Read);

                return cryptoStream;
            }
            catch
            {
                // W razie błędu domknij FileStream
                fs.Dispose();
                throw;
            }
        }

        public override bool DeleteFile(FileDTO fileInfo, User user)
        {
            var filePath = Path.Combine(StoragePath, user.KeycloakId, fileInfo.FileId);

            if (!System.IO.File.Exists(filePath))
                throw new FileNotFoundException("Encrypted file not found.", filePath);

            if (string.IsNullOrWhiteSpace(StoragePath))
                throw new InvalidOperationException("LocalStorage:BasePath is not configured.");

            try
            {
                System.IO.File.Delete(filePath);
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}