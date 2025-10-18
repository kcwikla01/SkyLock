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

            CreateMap<Skylock.Database.Models.File, FileDTO>()
                .ForMember(dest => dest.FileId, opt => opt.MapFrom(src => src.FileName))
                .ForMember(dest => dest.OriginalFileName, opt => opt.MapFrom(src => src.OriginalFileName))
                .ForMember(dest => dest.StorageType, opt => opt.MapFrom(src => src.StorageType))
                .ForMember(dest => dest.UploadedAt, opt => opt.MapFrom(src => src.UploadedAt));
        }
    }
}
