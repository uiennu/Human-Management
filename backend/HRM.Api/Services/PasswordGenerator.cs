using System.Security.Cryptography;
using System.Text;

namespace HRM.Api.Services
{
    public interface IPasswordGenerator
    {
        string GenerateTemporaryPassword(int length = 12);
    }

    public class PasswordGenerator : IPasswordGenerator
    {
        private const string LowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        private const string UppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string DigitChars = "0123456789";
        private const string SpecialChars = "!@#$%^&*";

        public string GenerateTemporaryPassword(int length = 12)
        {
            if (length < 8)
                throw new ArgumentException("Password length must be at least 8 characters");

            var password = new StringBuilder();
            var allChars = LowercaseChars + UppercaseChars + DigitChars + SpecialChars;

            // Ensure at least one of each type
            password.Append(GetRandomChar(LowercaseChars));
            password.Append(GetRandomChar(UppercaseChars));
            password.Append(GetRandomChar(DigitChars));
            password.Append(GetRandomChar(SpecialChars));

            // Fill the rest randomly
            for (int i = 4; i < length; i++)
            {
                password.Append(GetRandomChar(allChars));
            }

            // Shuffle the password
            return ShuffleString(password.ToString());
        }

        private char GetRandomChar(string chars)
        {
            var randomIndex = RandomNumberGenerator.GetInt32(0, chars.Length);
            return chars[randomIndex];
        }

        private string ShuffleString(string input)
        {
            var array = input.ToCharArray();
            int n = array.Length;
            
            for (int i = n - 1; i > 0; i--)
            {
                int j = RandomNumberGenerator.GetInt32(0, i + 1);
                // Swap
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            
            return new string(array);
        }
    }
}
