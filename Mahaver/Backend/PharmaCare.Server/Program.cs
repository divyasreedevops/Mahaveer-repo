var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<PharmaCare.Server.Data.DbContext>();
builder.Services.AddScoped<PharmaCare.Server.Data.AdminRepository>();
builder.Services.AddScoped<PharmaCare.Server.Data.PatientRepository>();
builder.Services.AddScoped<PharmaCare.Server.Data.InventoryRepository>();
builder.Services.AddScoped<PharmaCare.Server.Data.UserRepository>();
builder.Services.AddScoped<PharmaCare.Server.Data.OtpRepository>();

builder.Services.AddScoped<PharmaCare.Server.Business.AuthService>();
builder.Services.AddScoped<PharmaCare.Server.Business.PatientService>();
builder.Services.AddScoped<PharmaCare.Server.Business.InventoryService>();
builder.Services.AddScoped<PharmaCare.Server.Business.UserService>();
builder.Services.AddScoped<PharmaCare.Server.Business.OtpService>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
