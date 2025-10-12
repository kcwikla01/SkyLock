using AutoMapper;
using Skylock.Database.Models;

namespace Skylock.Automapper
{
    public class MapperProfile : Profile
    {
        public MapperProfile()
        {
            CreateMap<UserLoginDto, User>()
            .ForMember(dest => dest.KeycloakId, opt => opt.MapFrom(src => src.KeycloakId))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName));
        }
    }
}
