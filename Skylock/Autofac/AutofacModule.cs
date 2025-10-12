
using Autofac;
using Skylock.UnitsOfWorks.Base;
using Skylock.WEB.ApplicationServices.Base;
namespace Skylock.Autofac
{
    public class AutofacModule : Module
    {
        protected override void Load(ContainerBuilder builder)
        {
            base.Load(builder);

            builder.RegisterAssemblyTypes(typeof(IApplicationService).Assembly)
            .Where(t => t.GetInterfaces().Any(i =>
                typeof(IApplicationService).IsAssignableFrom(i) && i != typeof(IApplicationService)))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();

            builder.RegisterAssemblyTypes(typeof(IApplicationService).Assembly)
            .Where(t => t.GetInterfaces().Any(i =>
                typeof(IUnitOfWork).IsAssignableFrom(i) && i != typeof(IApplicationService)))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();
        }
    }
}
