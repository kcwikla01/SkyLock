using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Skylock.Database.Models;

namespace Skylock.Database.DbContext
{
    public class SkylockDbContext : Microsoft.EntityFrameworkCore.DbContext
    {
        public DbSet<User> Users { get; set; }
        public SkylockDbContext(DbContextOptions options) : base(options)
        {
        }

        public SkylockDbContext()
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer("Name=Database:ConnectionString");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.KeycloakId);
                entity.Property(u => u.Email).IsRequired();
                entity.Property(u => u.UserName).IsRequired();
            });
        }

    }
}
