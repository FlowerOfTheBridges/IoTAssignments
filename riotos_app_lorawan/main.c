#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>    

#include "msg.h"
#include "shell.h"
#include "fmt.h"

#include "net/loramac.h"
#include "semtech_loramac.h"
#include "thread.h"

semtech_loramac_t loramac;  /* The loramac stack device descriptor */

static int DEFAULT_CONNECTION_TIMEOUT = 30; // seconds 

/**
 * Generates a random number given a particular range.
 * @param {int} min_num 
 * @param {int} max_num
 * @returns {int} random int
 */
int random_number(int min_num, int max_num)
{
    srand(time(NULL));
    int result = (rand() % (min_num - max_num)) + min_num;
    return result;
}

/**
 * Appends an integer value to the current string after the "|" separator
 * 
 * @param {char *} msg the string where we want to insert the integer value
 * @param {int} value the integer value we want to append
 */
void concat_msg(char *msg, int value)
{
    char buf[12];
    snprintf(buf, 12, "%d|", value); // puts string into buffer
    strcat(msg, buf);
}

/**
 * @returns a string of the form <temp>|<hum>|<wind_dir>|<wind_int>|<rain> 
 */
char * get_measure_msg(void)
{
    static char msg[100];
    memset(msg, 0, sizeof msg);
    /* getting random temperature */
    int16_t temp = random_number(-50,50);
    concat_msg(msg, temp);

    /* getting random humidity */
    uint16_t hum = random_number(0,100);
    concat_msg(msg, hum);

    /* getting random wind direction */
    int16_t wind_dir = random_number(0,360);
    concat_msg(msg, wind_dir);

    /* getting random wind intensity */
    int16_t wind_int = random_number(0,100);
    concat_msg(msg, wind_int);

    /* getting random rain height */
    int16_t rain = random_number(0,50);
    concat_msg(msg, rain);

    return msg;
}


/**
 * run command, which establish a connection with TTN in order to send data on the uplink
 * some values retrieved from sensors. Needs three parameters: 
 * (You can retrieve those informations on https://console.thethingsnetwork.org/applications/<your app id>/devices)
 * - deveui: hex string
 * - appei: hex string
 * - appkey: hex string
 */
static int run(int argc, char **argv)
{
    uint8_t deveui[LORAMAC_DEVEUI_LEN];
    uint8_t appeui[LORAMAC_APPEUI_LEN];
    uint8_t appkey[LORAMAC_APPKEY_LEN];

    if (argc < 3) {
        printf("usage: %s <deveui> <appeui> <appkey> \n",
                argv[0]);
        return 1;
    }
    else {
        semtech_loramac_init(&loramac); /* init the mac layer */

        /* convert string to byte array */
        fmt_hex_bytes(deveui, argv[1]);
        semtech_loramac_set_deveui(&loramac, deveui);

        fmt_hex_bytes(appeui, argv[2]);
        semtech_loramac_set_appeui(&loramac, appeui);

        fmt_hex_bytes(appkey, argv[3]);
        semtech_loramac_set_appkey(&loramac, appkey);

        semtech_loramac_set_dr(&loramac, 6);
        /* make connection */
        if (semtech_loramac_join(&loramac, LORAMAC_JOIN_OTAA) != SEMTECH_LORAMAC_JOIN_SUCCEEDED) {
            printf("Join procedure failed.\n");
            return 1;
        }
        printf("Join procedure succeeded.\n");
        /* start measurement procedure */
        char *message = NULL;
        while(1) {
            printf("Waiting %d seconds before sending information.\n", DEFAULT_CONNECTION_TIMEOUT);
            xtimer_sleep(DEFAULT_CONNECTION_TIMEOUT);

            message = get_measure_msg();
            /* send message */ 
            switch (semtech_loramac_send(&loramac,
                                     (uint8_t *)message, strlen(message))) {
                case SEMTECH_LORAMAC_NOT_JOINED:
                    puts("Cannot send: not joined");
                    return 1;

                case SEMTECH_LORAMAC_DUTYCYCLE_RESTRICTED:
                    puts("Cannot send: dutycycle restriction");
                    return 1;

                case SEMTECH_LORAMAC_BUSY:
                    puts("Cannot send: MAC is busy");
                    return 1;

                case SEMTECH_LORAMAC_TX_ERROR:
                    puts("Cannot send: error");
                    return 1;
                }

            /* wait for receive windows */
            switch (semtech_loramac_recv(&loramac)) {
                case SEMTECH_LORAMAC_DATA_RECEIVED:
                    loramac.rx_data.payload[loramac.rx_data.payload_len] = 0;
                    printf("Data received: %s, port: %d\n",
                       (char *)loramac.rx_data.payload, loramac.rx_data.port);
                    break;

                case SEMTECH_LORAMAC_DUTYCYCLE_RESTRICTED:
                    puts("Cannot send: dutycycle restriction");
                    return 1;

                case SEMTECH_LORAMAC_BUSY:
                    puts("Cannot send: MAC is busy");
                    return 1;

                case SEMTECH_LORAMAC_TX_ERROR:
                    puts("Cannot send: error");
                    return 1;

                case SEMTECH_LORAMAC_TX_DONE:
                    printf("TX complete: message %s sent successfully. No data received on downlink.\n", message);
                    break;
            }
        }
    
        return 0;
    }
}

static const shell_command_t shell_commands[] = {
    {"run", "run the measurement process over the things network.", run},
    { NULL, NULL, NULL }
};

int main(void)
{
    puts("LORA-WAN Environmental Station\n");
    puts("Type 'help' to get started. Have a look at the README.md for more"
         "information.");

    /* start shell */
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);    

    /* should be never reached */
    return 0;
}
