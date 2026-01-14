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

        public override string SaveFile(IFormFile file, string targetFileName, User user, string? FilePath)
        {
            if (file == null) throw new ArgumentNullException(nameof(file));
            if (file.Length == 0) throw new ArgumentException("File is empty.", nameof(file));
            if (string.IsNullOrWhiteSpace(StoragePath))
                throw new InvalidOperationException("LocalStorage:BasePath is not configured.");

            string subFolder = FilePath ?? string.Empty;

            var userDirectoryPath = Path.Combine(StoragePath, user.KeycloakId, subFolder);

            Directory.CreateDirectory(userDirectoryPath);

            var filePath = Path.Combine(userDirectoryPath, targetFileName);

            using var input = file.OpenReadStream();

            using var output = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, bufferSize: 64 * 1024);

            input.CopyTo(output);

            return filePath;
        }

        public override Stream DownloadFile(FileDTO fileInfo, User user)
        {
            var filePath = fileInfo.FilePath;

            if (!System.IO.File.Exists(filePath))
                throw new FileNotFoundException("Encrypted file not found.", filePath);

            var fs = new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 64 * 1024,
                options: FileOptions.SequentialScan);

            return fs;
        }

        public override bool DeleteFile(FileDTO fileInfo, User user)
        {
            var filePath = fileInfo.FilePath;

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