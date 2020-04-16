#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>    

#include "shell.h"
#include "msg.h"
#include "net/emcute.h"
#include "net/ipv6/addr.h"

#define EMCUTE_PORT         (1883U)
#define EMCUTE_PRIO         (THREAD_PRIORITY_MAIN - 1)
#define EMCUTE_ID           ("gertrude")
#define NUMOFSUBS           (16U)
#define TOPIC_MAXLEN        (64U)

static char stack[THREAD_STACKSIZE_DEFAULT];
static msg_t queue[8];

static int DEFAULT_CONNECTION = 5; // seconds 
static char DEFAULT_TOPIC[] = "riot/weather";

/**
 * thread related to the mqtt client
 */
static void *emcute_thread(void *arg)
{
    (void)arg;
    emcute_run(EMCUTE_PORT, arg);
    return NULL;    /* should never be reached */
}

/**
 * publish a message to a given topic
 * @param {char *} topic 
 * @param {char *} msg
 * 
 * @returns status of the operation 
 */
int pub(char *topic, char *msg)
{
    emcute_topic_t t;
    unsigned flags = EMCUTE_QOS_0;
    
    printf("pub with topic: %s and name %s and flags 0x%02x\n", topic, msg, (int)flags);

    /* step 1: get topic id */
    t.name = topic;
    if (emcute_reg(&t) != EMCUTE_OK) {
        puts("error: unable to obtain topic ID");
        return 1;
    }

    /* step 2: publish data */
    if (emcute_pub(&t, msg, strlen(msg), flags) != EMCUTE_OK) {
        printf("error: unable to publish data to topic '%s [%i]'\n",
                t.name, (int)t.id);
        return 1;
    }

    printf("Published %i bytes to topic '%s [%i]'\n",
            (int)strlen(msg), t.name, t.id);

    return 0;
}


int con(char *address, char *port)
{
    sock_udp_ep_t gw = { .family = AF_INET6, .port = EMCUTE_PORT };
    char *topic = NULL;
    char *message = NULL;
    size_t len = 0;

    /* parse address */
    if (ipv6_addr_from_str((ipv6_addr_t *)&gw.addr.ipv6, address) == NULL) {
        printf("error parsing ipv6 address %s.\n", address);
        return 0;
    }

    if (port != NULL) {
        gw.port = atoi(port);
    }

    if (emcute_con(&gw, true, topic, message, len, 0) != EMCUTE_OK) {
        printf("error: unable to connect to [%s]:%i\n", address, (int)gw.port);
        return 0;
    }
    printf("Successfully connected to gateway at [%s]:%i\n",
           address, (int)gw.port);

    return 1;
}

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
 * run command, which establish a connection with the broker in order to publish in the default topic
 * some values retrieved from sensors. Needs three parameters:
 * - id: string
 * - address: the ipv6 address of the broker
 * - port [optional]: the udp port where the broker is listening
 */
static int run(int argc, char **argv)
{
    int is_connected = 0;
    int tries = 5;

    char *id = NULL;
    char *ip = NULL;
    char *port = NULL;

    if (argc < 3) {
        printf("usage: %s <id> <ipv6 addr> [port] \n",
                argv[0]);
        return 1;
    }
    else {
        id = argv[1];
        ip = argv[2];
    }
    if (argc >= 3) {
        port = argv[3];
    }
    /* start the emcute thread */
    thread_create(stack, sizeof(stack), EMCUTE_PRIO, 0,
                  emcute_thread, id, "emcute");

    /* try to establish a connection */              
    while(tries > 0 && !is_connected){
        printf("trying connecting with ip %s and port %s", ip, port);
        is_connected = con(ip, port);
        if(!is_connected){
            tries--;
            printf("Failed to connect, retrying %d more times in %d seconds.\n", tries, DEFAULT_CONNECTION);
            xtimer_sleep(DEFAULT_CONNECTION);
        }
        else{
            printf("successfuly connected to broker!");
        }
    }

    if(is_connected){
        /* get values and publish them on default topic */
        while(1){
            char *msg = get_measure_msg();
            strcat(msg, id);
            pub(DEFAULT_TOPIC, msg);
            xtimer_sleep(DEFAULT_CONNECTION);
        }
    }

    return 0;
}

/**
 * close the connection to the broker.
 */
static int cmd_discon(int argc, char **argv)
{
    (void)argc;
    (void)argv;

    int res = emcute_discon();
    if (res == EMCUTE_NOGW) {
        puts("error: not connected to any broker");
        return 1;
    }
    else if (res != EMCUTE_OK) {
        puts("error: unable to disconnect");
        return 1;
    }
    puts("Disconnect successful");
    return 0;
}

static const shell_command_t shell_commands[] = {
    {"run", "run the measurement process", run},
    {"discon", "disconnect from the current broker", cmd_discon},
    { NULL, NULL, NULL }
};

int main(void)
{
    puts("MQTT-SN Environmental Station\n");
    puts("Type 'help' to get started. Have a look at the README.md for more"
         "information.");

    /* the main thread needs a msg queue to be able to run `ping6`*/
    msg_init_queue(queue, (sizeof(queue) / sizeof(msg_t)));
    
    /* start shell */
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);    

    /* should be never reached */
    return 0;
}
