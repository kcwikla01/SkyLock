
using Autofac;
using Skylock.Aggregate.Base;
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

            builder.RegisterAssemblyTypes(typeof(IUnitOfWork).Assembly)
            .Where(t => t.GetInterfaces().Any(i =>
                typeof(IUnitOfWork).IsAssignableFrom(i) && i != typeof(IApplicationService)))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();

            builder.RegisterAssemblyTypes(typeof(IAggregate).Assembly)
            .Where(t => t.GetInterfaces().Any(i =>
                typeof(IAggregate).IsAssignableFrom(i) && i != typeof(IApplicationService)))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();

            builder.RegisterAssemblyTypes(typeof(IAggregateFactory).Assembly)
            .Where(t => t.GetInterfaces().Any(i =>
                typeof(IAggregateFactory).IsAssignableFrom(i) && i != typeof(IApplicationService)))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();

        }
    }
}
